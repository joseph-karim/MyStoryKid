/**
 * Shopify Integration Service
 * 
 * This service handles the integration with Shopify for e-commerce functionality,
 * including digital downloads, print products, cart management, and payment processing.
 */

import { generateDigitalPDF, generatePrintInteriorPDF, generatePrintCoverPDF } from './pdfService';
import { calculateCoverDimensions, createPrintJob } from './luluService';
import { uploadFileToSupabase } from './supabaseClient';

// Shopify configuration
const SHOPIFY_STORE_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const SHOPIFY_ADMIN_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN;

// Default product prices
const DEFAULT_DIGITAL_PRICE = 10.00;
const DEFAULT_PRINT_PRICE = 24.99;
const DEFAULT_EXPEDITED_SHIPPING_PRICE = 9.99;

// Shopify Storefront API endpoint
const STOREFRONT_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`;
const ADMIN_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10`;

/**
 * Makes a GraphQL request to Shopify Storefront API
 * @param {string} query - GraphQL query
 * @param {Object} variables - Query variables
 * @returns {Promise<Object>} - API response
 */
const makeStorefrontRequest = async (query, variables = {}) => {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    throw new Error('Shopify configuration missing. Please set VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN');
  }

  try {
    const response = await fetch(STOREFRONT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`Shopify GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  } catch (error) {
    console.error('[shopifyService] Storefront API request failed:', error);
    throw error;
  }
};

/**
 * Makes a REST API request to Shopify Admin API
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - API response
 */
const makeAdminRequest = async (endpoint, options = {}) => {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_ACCESS_TOKEN) {
    throw new Error('Shopify Admin configuration missing. Please set VITE_SHOPIFY_ADMIN_ACCESS_TOKEN');
  }

  try {
    const response = await fetch(`${ADMIN_API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Shopify Admin API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[shopifyService] Admin API request failed:', error);
    throw error;
  }
};

/**
 * Creates a checkout session for a book
 * @param {Object} book - The book object
 * @param {string} variant - The product variant ('digital', 'print-standard', 'print-expedited', 'print-standard-enhanced', 'print-expedited-enhanced')
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Checkout session data
 */
export const createCheckoutSession = async (book, variant = 'digital', options = {}) => {
  try {
    console.log('[shopifyService] Creating checkout session for book:', book.id, 'variant:', variant);

    // First, ensure the product exists in Shopify
    const product = await createOrUpdateShopifyProduct(book, options);
    
    // Find the appropriate variant
    const selectedVariant = product.variants.find(v => v.sku === variant);
    if (!selectedVariant) {
      throw new Error(`Variant ${variant} not found for product ${product.id}`);
    }

    // Create checkout using Storefront API
    const checkoutCreateMutation = `
      mutation checkoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
            totalPriceV2 {
              amount
              currencyCode
            }
            lineItems(first: 10) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    title
                    priceV2 {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          checkoutUserErrors {
            field
            message
          }
        }
      }
    `;

    const checkoutInput = {
      lineItems: [
        {
          variantId: selectedVariant.id,
          quantity: 1,
          customAttributes: [
            {
              key: 'book_id',
              value: book.id
            },
            {
              key: 'book_title',
              value: book.title
            },
            {
              key: 'child_name',
              value: book.childName || 'Child'
            }
          ]
        }
      ],
      allowPartialAddresses: true
    };

    // Add enhancement cost if applicable
    if (options.printEnhancement && options.enhancementCost > 0) {
      checkoutInput.customAttributes = [
        {
          key: 'enhancement_cost',
          value: options.enhancementCost.toString()
        },
        {
          key: 'enhancement_enabled',
          value: 'true'
        }
      ];
    }

    const result = await makeStorefrontRequest(checkoutCreateMutation, { input: checkoutInput });

    if (result.checkoutCreate.checkoutUserErrors.length > 0) {
      throw new Error(`Checkout creation failed: ${JSON.stringify(result.checkoutCreate.checkoutUserErrors)}`);
    }

    const checkout = result.checkoutCreate.checkout;
    
    console.log('[shopifyService] Checkout session created successfully:', checkout.id);

    return {
      checkoutId: checkout.id,
      checkoutUrl: checkout.webUrl,
      totalPrice: checkout.totalPriceV2.amount,
      currency: checkout.totalPriceV2.currencyCode,
      lineItems: checkout.lineItems.edges.map(edge => edge.node)
    };

  } catch (error) {
    console.error('[shopifyService] Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Creates or updates a Shopify product for a book
 * @param {Object} book - The book object
 * @param {Object} options - Product options
 * @returns {Promise<Object>} - The Shopify product data
 */
export const createOrUpdateShopifyProduct = async (book, options = {}) => {
  try {
    console.log('[shopifyService] Creating/updating Shopify product for book:', book.id);
    
    const digitalPrice = options.digitalPrice || DEFAULT_DIGITAL_PRICE;
    const printPrice = options.printPrice || DEFAULT_PRINT_PRICE;
    const expeditedShippingPrice = options.expeditedShippingPrice || DEFAULT_EXPEDITED_SHIPPING_PRICE;
    const enhancementCost = options.enhancementCost || 0;

    // Check if product already exists
    let existingProduct = null;
    try {
      const productsResponse = await makeAdminRequest(`/products.json?handle=${book.id}`);
      existingProduct = productsResponse.products?.[0];
    } catch (error) {
      console.log('[shopifyService] Product does not exist, will create new one');
    }

    const productData = {
      title: `${book.title} - Personalized Story for ${book.childName || 'Child'}`,
      body_html: `<p>A personalized story featuring ${book.childName || 'your child'} as the main character!</p>
                  <p>This magical story is customized just for ${book.childName || 'your child'}, making them the hero of their own adventure.</p>
                  <p>Available as a digital download or beautiful printed book.</p>`,
      vendor: 'MyStoryKid',
      product_type: 'Personalized Book',
      handle: book.id,
      tags: ['personalized', 'children', 'story', 'custom'],
      images: book.coverImageUrl ? [{ src: book.coverImageUrl }] : [],
      variants: [
        {
          title: 'Digital Download',
          sku: 'digital',
          price: digitalPrice.toFixed(2),
          requires_shipping: false,
          inventory_management: null,
          inventory_policy: 'continue',
          fulfillment_service: 'manual',
          weight: 0,
          weight_unit: 'lb'
        },
        {
          title: 'Printed Book - Standard Shipping',
          sku: 'print-standard',
          price: printPrice.toFixed(2),
          requires_shipping: true,
          inventory_management: null,
          inventory_policy: 'continue',
          fulfillment_service: 'manual',
          weight: 0.5,
          weight_unit: 'lb'
        },
        {
          title: 'Printed Book - Expedited Shipping',
          sku: 'print-expedited',
          price: (printPrice + expeditedShippingPrice).toFixed(2),
          requires_shipping: true,
          inventory_management: null,
          inventory_policy: 'continue',
          fulfillment_service: 'manual',
          weight: 0.5,
          weight_unit: 'lb'
        }
      ]
    };

    // Add enhanced variants if enhancement cost is provided
    if (enhancementCost > 0) {
      productData.variants.push(
        {
          title: 'Printed Book - Standard Shipping (Enhanced)',
          sku: 'print-standard-enhanced',
          price: (printPrice + enhancementCost).toFixed(2),
          requires_shipping: true,
          inventory_management: null,
          inventory_policy: 'continue',
          fulfillment_service: 'manual',
          weight: 0.5,
          weight_unit: 'lb'
        },
        {
          title: 'Printed Book - Expedited Shipping (Enhanced)',
          sku: 'print-expedited-enhanced',
          price: (printPrice + expeditedShippingPrice + enhancementCost).toFixed(2),
          requires_shipping: true,
          inventory_management: null,
          inventory_policy: 'continue',
          fulfillment_service: 'manual',
          weight: 0.5,
          weight_unit: 'lb'
        }
      );
    }

    let product;
    if (existingProduct) {
      // Update existing product
      const updateResponse = await makeAdminRequest(`/products/${existingProduct.id}.json`, {
        method: 'PUT',
        body: JSON.stringify({ product: productData })
      });
      product = updateResponse.product;
    } else {
      // Create new product
      const createResponse = await makeAdminRequest('/products.json', {
        method: 'POST',
        body: JSON.stringify({ product: productData })
      });
      product = createResponse.product;
    }
    
    console.log('[shopifyService] Shopify product created/updated:', product.id);
    
    return product;
  } catch (error) {
    console.error('[shopifyService] Error creating/updating Shopify product:', error);
    throw error;
  }
};

/**
 * Generates a checkout URL for a book (legacy method for backward compatibility)
 * @param {Object} book - The book object
 * @param {string} variant - The product variant
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - The checkout URL
 */
export const getCheckoutUrl = async (book, variant = 'digital', options = {}) => {
  try {
    const checkoutSession = await createCheckoutSession(book, variant, options);
    return checkoutSession.checkoutUrl;
  } catch (error) {
    console.error('[shopifyService] Error generating checkout URL:', error);
    // Fallback to mock URL for development
    const shopifyStoreUrl = `https://${SHOPIFY_STORE_DOMAIN}` || 'https://your-shopify-store.myshopify.com';
    return `${shopifyStoreUrl}/cart/add?id=${book.id}&variant=${variant}`;
  }
};

/**
 * Retrieves cart information
 * @param {string} checkoutId - The checkout ID
 * @returns {Promise<Object>} - Cart information
 */
export const getCart = async (checkoutId) => {
  try {
    const cartQuery = `
      query getCheckout($checkoutId: ID!) {
        node(id: $checkoutId) {
          ... on Checkout {
            id
            webUrl
            totalPriceV2 {
              amount
              currencyCode
            }
            subtotalPriceV2 {
              amount
              currencyCode
            }
            totalTaxV2 {
              amount
              currencyCode
            }
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    title
                    priceV2 {
                      amount
                      currencyCode
                    }
                    image {
                      url
                      altText
                    }
                  }
                }
              }
            }
            discountApplications(first: 10) {
              edges {
                node {
                  ... on DiscountCodeApplication {
                    code
                    applicable
                    value {
                      ... on MoneyV2 {
                        amount
                        currencyCode
                      }
                      ... on PricingPercentageValue {
                        percentage
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await makeStorefrontRequest(cartQuery, { checkoutId });
    
    if (!result.node) {
      throw new Error('Checkout not found');
    }

    return {
      id: result.node.id,
      webUrl: result.node.webUrl,
      totalPrice: result.node.totalPriceV2,
      subtotalPrice: result.node.subtotalPriceV2,
      totalTax: result.node.totalTaxV2,
      lineItems: result.node.lineItems.edges.map(edge => edge.node),
      discountApplications: result.node.discountApplications.edges.map(edge => edge.node)
    };
  } catch (error) {
    console.error('[shopifyService] Error retrieving cart:', error);
    throw error;
  }
};

/**
 * Adds items to cart
 * @param {string} checkoutId - The checkout ID
 * @param {Array} lineItems - Items to add
 * @returns {Promise<Object>} - Updated cart information
 */
export const addToCart = async (checkoutId, lineItems) => {
  try {
    const addToCartMutation = `
      mutation checkoutLineItemsAdd($checkoutId: ID!, $lineItems: [CheckoutLineItemInput!]!) {
        checkoutLineItemsAdd(checkoutId: $checkoutId, lineItems: $lineItems) {
          checkout {
            id
            webUrl
            totalPriceV2 {
              amount
              currencyCode
            }
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    title
                    priceV2 {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          checkoutUserErrors {
            field
            message
          }
        }
      }
    `;

    const result = await makeStorefrontRequest(addToCartMutation, { checkoutId, lineItems });

    if (result.checkoutLineItemsAdd.checkoutUserErrors.length > 0) {
      throw new Error(`Add to cart failed: ${JSON.stringify(result.checkoutLineItemsAdd.checkoutUserErrors)}`);
    }

    return result.checkoutLineItemsAdd.checkout;
  } catch (error) {
    console.error('[shopifyService] Error adding to cart:', error);
    throw error;
  }
};

/**
 * Updates cart item quantities
 * @param {string} checkoutId - The checkout ID
 * @param {Array} lineItems - Items to update with new quantities
 * @returns {Promise<Object>} - Updated cart information
 */
export const updateCartItems = async (checkoutId, lineItems) => {
  try {
    const updateCartMutation = `
      mutation checkoutLineItemsUpdate($checkoutId: ID!, $lineItems: [CheckoutLineItemUpdateInput!]!) {
        checkoutLineItemsUpdate(checkoutId: $checkoutId, lineItems: $lineItems) {
          checkout {
            id
            webUrl
            totalPriceV2 {
              amount
              currencyCode
            }
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    title
                    priceV2 {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          checkoutUserErrors {
            field
            message
          }
        }
      }
    `;

    const result = await makeStorefrontRequest(updateCartMutation, { checkoutId, lineItems });

    if (result.checkoutLineItemsUpdate.checkoutUserErrors.length > 0) {
      throw new Error(`Cart update failed: ${JSON.stringify(result.checkoutLineItemsUpdate.checkoutUserErrors)}`);
    }

    return result.checkoutLineItemsUpdate.checkout;
  } catch (error) {
    console.error('[shopifyService] Error updating cart items:', error);
    throw error;
  }
};

/**
 * Removes items from cart
 * @param {string} checkoutId - The checkout ID
 * @param {Array} lineItemIds - IDs of items to remove
 * @returns {Promise<Object>} - Updated cart information
 */
export const removeFromCart = async (checkoutId, lineItemIds) => {
  try {
    const removeFromCartMutation = `
      mutation checkoutLineItemsRemove($checkoutId: ID!, $lineItemIds: [ID!]!) {
        checkoutLineItemsRemove(checkoutId: $checkoutId, lineItemIds: $lineItemIds) {
          checkout {
            id
            webUrl
            totalPriceV2 {
              amount
              currencyCode
            }
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    title
                    priceV2 {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          checkoutUserErrors {
            field
            message
          }
        }
      }
    `;

    const result = await makeStorefrontRequest(removeFromCartMutation, { checkoutId, lineItemIds });

    if (result.checkoutLineItemsRemove.checkoutUserErrors.length > 0) {
      throw new Error(`Remove from cart failed: ${JSON.stringify(result.checkoutLineItemsRemove.checkoutUserErrors)}`);
    }

    return result.checkoutLineItemsRemove.checkout;
  } catch (error) {
    console.error('[shopifyService] Error removing from cart:', error);
    throw error;
  }
};

/**
 * Applies a discount code to checkout
 * @param {string} checkoutId - The checkout ID
 * @param {string} discountCode - The discount code to apply
 * @returns {Promise<Object>} - Updated checkout information
 */
export const applyDiscountCode = async (checkoutId, discountCode) => {
  try {
    const applyDiscountMutation = `
      mutation checkoutDiscountCodeApplyV2($checkoutId: ID!, $discountCode: String!) {
        checkoutDiscountCodeApplyV2(checkoutId: $checkoutId, discountCode: $discountCode) {
          checkout {
            id
            webUrl
            totalPriceV2 {
              amount
              currencyCode
            }
            subtotalPriceV2 {
              amount
              currencyCode
            }
            discountApplications(first: 10) {
              edges {
                node {
                  ... on DiscountCodeApplication {
                    code
                    applicable
                    value {
                      ... on MoneyV2 {
                        amount
                        currencyCode
                      }
                      ... on PricingPercentageValue {
                        percentage
                      }
                    }
                  }
                }
              }
            }
          }
          checkoutUserErrors {
            field
            message
          }
        }
      }
    `;

    const result = await makeStorefrontRequest(applyDiscountMutation, { checkoutId, discountCode });

    if (result.checkoutDiscountCodeApplyV2.checkoutUserErrors.length > 0) {
      throw new Error(`Discount code application failed: ${JSON.stringify(result.checkoutDiscountCodeApplyV2.checkoutUserErrors)}`);
    }

    return result.checkoutDiscountCodeApplyV2.checkout;
  } catch (error) {
    console.error('[shopifyService] Error applying discount code:', error);
    throw error;
  }
};

/**
 * Removes a discount code from checkout
 * @param {string} checkoutId - The checkout ID
 * @returns {Promise<Object>} - Updated checkout information
 */
export const removeDiscountCode = async (checkoutId) => {
  try {
    const removeDiscountMutation = `
      mutation checkoutDiscountCodeRemove($checkoutId: ID!) {
        checkoutDiscountCodeRemove(checkoutId: $checkoutId) {
          checkout {
            id
            webUrl
            totalPriceV2 {
              amount
              currencyCode
            }
            subtotalPriceV2 {
              amount
              currencyCode
            }
            discountApplications(first: 10) {
              edges {
                node {
                  ... on DiscountCodeApplication {
                    code
                    applicable
                    value {
                      ... on MoneyV2 {
                        amount
                        currencyCode
                      }
                      ... on PricingPercentageValue {
                        percentage
                      }
                    }
                  }
                }
              }
            }
          }
          checkoutUserErrors {
            field
            message
          }
        }
      }
    `;

    const result = await makeStorefrontRequest(removeDiscountMutation, { checkoutId });

    if (result.checkoutDiscountCodeRemove.checkoutUserErrors.length > 0) {
      throw new Error(`Discount code removal failed: ${JSON.stringify(result.checkoutDiscountCodeRemove.checkoutUserErrors)}`);
    }

    return result.checkoutDiscountCodeRemove.checkout;
  } catch (error) {
    console.error('[shopifyService] Error removing discount code:', error);
    throw error;
  }
};

/**
 * Processes an order from Shopify
 * @param {Object} order - The Shopify order
 * @returns {Promise<Object>} - The processing result
 */
export const processShopifyOrder = async (order) => {
  try {
    console.log('[shopifyService] Processing Shopify order:', order.id);
    
    // Check if this is a digital or print order
    const isDigitalOrder = order.variants.some(v => v.title === 'Digital Download');
    const isPrintOrder = order.variants.some(v => v.title.includes('Printed Book'));
    
    if (isDigitalOrder) {
      // Process digital order
      return await processDigitalOrder(order);
    }
    
    if (isPrintOrder) {
      // Process print order
      const isExpedited = order.variants.some(v => v.title.includes('Expedited'));
      const isEnhanced = order.variants.some(v => v.title.includes('Enhanced'));
      return await processPrintOrder(order, isExpedited, isEnhanced);
    }
    
    throw new Error('Unknown order type');
  } catch (error) {
    console.error('[shopifyService] Error processing Shopify order:', error);
    throw error;
  }
};

/**
 * Processes a digital order
 * @param {Object} order - The Shopify order
 * @returns {Promise<Object>} - The processing result with download link
 */
const processDigitalOrder = async (order) => {
  try {
    console.log('[shopifyService] Processing digital order:', order.id);
    
    // Get the book ID from the order
    const bookId = order.line_items[0].product_id;
    
    // In a production environment, we would fetch the book data from the database
    // For now, we'll assume we have the book data
    const book = order.book; // This would come from the database in production
    
    // Generate the digital PDF
    const pdfBuffer = await generateDigitalPDF(book);
    
    // Upload the PDF to Supabase or another storage service
    const filename = `${book.id}_${Date.now()}.pdf`;
    const pdfUrl = await uploadFileToSupabase(
      new Blob([pdfBuffer], { type: 'application/pdf' }),
      filename,
      'digital-downloads'
    );
    
    // In a production environment, we would store the download link in the database
    // and associate it with the order and customer
    
    console.log('[shopifyService] Digital order processed successfully');
    
    return {
      orderId: order.id,
      type: 'digital',
      downloadUrl: pdfUrl,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
  } catch (error) {
    console.error('[shopifyService] Error processing digital order:', error);
    throw error;
  }
};

/**
 * Processes a print order
 * @param {Object} order - The Shopify order
 * @param {boolean} isExpedited - Whether the order is expedited
 * @param {boolean} isEnhanced - Whether the order includes image enhancement
 * @returns {Promise<Object>} - The processing result with Lulu job ID
 */
const processPrintOrder = async (order, isExpedited = false, isEnhanced = false) => {
  try {
    console.log('[shopifyService] Processing print order:', order.id, 'expedited:', isExpedited, 'enhanced:', isEnhanced);
    
    // Get the book ID from the order
    const bookId = order.line_items[0].product_id;
    
    // In a production environment, we would fetch the book data from the database
    // For now, we'll assume we have the book data
    const book = order.book; // This would come from the database in production
    
    // If enhanced, apply image enhancement before processing
    let processedBook = book;
    if (isEnhanced) {
      // Import the print-ready book service
      const { generatePrintReadyBook } = await import('./printReadyBookService');
      
      const printReadyResult = await generatePrintReadyBook(book, {
        forceEnhancement: true,
        onProgress: (progress) => {
          console.log('[shopifyService] Enhancement progress:', progress);
        }
      });
      
      if (printReadyResult.success) {
        processedBook = printReadyResult.enhancedBook;
      } else {
        console.warn('[shopifyService] Image enhancement failed, proceeding with original images');
      }
    }
    
    // Get the shipping address from the order
    const shippingAddress = {
      name: order.shipping_address.name,
      street1: order.shipping_address.address1,
      street2: order.shipping_address.address2,
      city: order.shipping_address.city,
      state_code: order.shipping_address.province_code,
      country_code: order.shipping_address.country_code,
      postcode: order.shipping_address.zip,
      phone_number: order.shipping_address.phone
    };
    
    // Define the POD package ID based on the book specifications
    // In a production environment, this would be determined based on the book's requirements
    const podPackageId = '0600X0900BWSTDPB060UW444MXX'; // Example: 6"x9" black and white paperback
    
    // Generate the print-ready interior PDF
    const interiorPdfBuffer = await generatePrintInteriorPDF(processedBook);
    
    // Upload the interior PDF to Supabase or another storage service
    const interiorFilename = `${processedBook.id}_interior_${Date.now()}.pdf`;
    const interiorPdfUrl = await uploadFileToSupabase(
      new Blob([interiorPdfBuffer], { type: 'application/pdf' }),
      interiorFilename,
      'print-files'
    );
    
    // Calculate the cover dimensions
    const pageCount = processedBook.pages.filter(page => page.type === 'content').length;
    const coverDimensions = await calculateCoverDimensions(podPackageId, pageCount);
    
    // Generate the print-ready cover PDF
    const coverPdfBuffer = await generatePrintCoverPDF(processedBook, coverDimensions);
    
    // Upload the cover PDF to Supabase or another storage service
    const coverFilename = `${processedBook.id}_cover_${Date.now()}.pdf`;
    const coverPdfUrl = await uploadFileToSupabase(
      new Blob([coverPdfBuffer], { type: 'application/pdf' }),
      coverFilename,
      'print-files'
    );
    
    // Determine the shipping level based on whether the order is expedited
    const shippingLevel = isExpedited ? 'EXPEDITED' : 'MAIL';
    
    // Create the print job with Lulu
    const printJob = await createPrintJob(
      {
        id: processedBook.id,
        title: processedBook.title,
        podPackageId,
        interiorUrl: interiorPdfUrl,
        coverUrl: coverPdfUrl,
        pageCount
      },
      shippingAddress,
      shippingLevel
    );
    
    // In a production environment, we would store the print job ID in the database
    // and associate it with the order and customer
    
    console.log('[shopifyService] Print order processed successfully');
    
    return {
      orderId: order.id,
      type: 'print',
      luluJobId: printJob.id,
      shippingLevel,
      isEnhanced,
      estimatedShipping: printJob.estimated_shipping_dates
    };
  } catch (error) {
    console.error('[shopifyService] Error processing print order:', error);
    throw error;
  }
};

/**
 * Handles a Shopify webhook
 * @param {Object} webhook - The webhook payload
 * @returns {Promise<Object>} - The processing result
 */
export const handleShopifyWebhook = async (webhook) => {
  try {
    console.log('[shopifyService] Handling Shopify webhook:', webhook.topic);
    
    // Handle different webhook topics
    switch (webhook.topic) {
      case 'orders/create':
        // Process the new order
        return await processShopifyOrder(webhook.data);
        
      case 'orders/cancelled':
        // Handle order cancellation
        console.log('[shopifyService] Order cancelled:', webhook.data.id);
        return { status: 'cancelled', orderId: webhook.data.id };
        
      case 'orders/paid':
        // Handle order payment confirmation
        console.log('[shopifyService] Order paid:', webhook.data.id);
        return { status: 'paid', orderId: webhook.data.id };
        
      case 'orders/fulfilled':
        // Handle order fulfillment
        console.log('[shopifyService] Order fulfilled:', webhook.data.id);
        return { status: 'fulfilled', orderId: webhook.data.id };
        
      default:
        console.log('[shopifyService] Unhandled webhook topic:', webhook.topic);
        return { status: 'ignored', topic: webhook.topic };
    }
  } catch (error) {
    console.error('[shopifyService] Error handling Shopify webhook:', error);
    throw error;
  }
};

/**
 * Validates Shopify configuration
 * @returns {Object} - Configuration status
 */
export const validateShopifyConfig = () => {
  return {
    storeDomain: !!SHOPIFY_STORE_DOMAIN,
    storefrontToken: !!SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    adminToken: !!SHOPIFY_ADMIN_ACCESS_TOKEN,
    isConfigured: !!(SHOPIFY_STORE_DOMAIN && SHOPIFY_STOREFRONT_ACCESS_TOKEN),
    isFullyConfigured: !!(SHOPIFY_STORE_DOMAIN && SHOPIFY_STOREFRONT_ACCESS_TOKEN && SHOPIFY_ADMIN_ACCESS_TOKEN)
  };
};
