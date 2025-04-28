/**
 * Shopify Integration Service
 * 
 * This service handles the integration with Shopify for e-commerce functionality,
 * including digital downloads and print products.
 */

import { generateDigitalPDF, generatePrintInteriorPDF, generatePrintCoverPDF } from './pdfService';
import { calculateCoverDimensions, createPrintJob } from './luluService';
import { uploadFileToSupabase } from './supabaseClient';

// Default product prices
const DEFAULT_DIGITAL_PRICE = 10.00;
const DEFAULT_PRINT_PRICE = 24.99;
const DEFAULT_EXPEDITED_SHIPPING_PRICE = 9.99;

/**
 * Creates or updates a Shopify product for a book
 * @param {Object} book - The book object
 * @param {Object} options - Product options
 * @returns {Promise<Object>} - The Shopify product data
 */
export const createShopifyProduct = async (book, options = {}) => {
  try {
    console.log('[shopifyService] Creating/updating Shopify product for book:', book.id);
    
    // In a production environment, this would call the Shopify API
    // For now, we'll return a mock response
    
    const digitalPrice = options.digitalPrice || DEFAULT_DIGITAL_PRICE;
    const printPrice = options.printPrice || DEFAULT_PRINT_PRICE;
    const expeditedShippingPrice = options.expeditedShippingPrice || DEFAULT_EXPEDITED_SHIPPING_PRICE;
    
    // Mock Shopify product data
    const shopifyProduct = {
      id: `shopify-product-${book.id}`,
      title: book.title,
      description: `A personalized story for ${book.childName}`,
      variants: [
        {
          id: `digital-${book.id}`,
          title: 'Digital Download',
          price: digitalPrice,
          requires_shipping: false
        },
        {
          id: `print-standard-${book.id}`,
          title: 'Printed Book - Standard Shipping',
          price: printPrice,
          requires_shipping: true
        },
        {
          id: `print-expedited-${book.id}`,
          title: 'Printed Book - Expedited Shipping',
          price: printPrice + expeditedShippingPrice,
          requires_shipping: true
        }
      ],
      checkout_url: `https://your-shopify-store.myshopify.com/cart/${book.id}?variant=digital`
    };
    
    console.log('[shopifyService] Shopify product created/updated:', shopifyProduct);
    
    return shopifyProduct;
  } catch (error) {
    console.error('[shopifyService] Error creating/updating Shopify product:', error);
    throw error;
  }
};

/**
 * Generates a checkout URL for a book
 * @param {Object} book - The book object
 * @param {string} variant - The product variant ('digital', 'print-standard', 'print-expedited')
 * @returns {string} - The checkout URL
 */
export const getCheckoutUrl = (book, variant = 'digital') => {
  // In a production environment, this would generate a proper Shopify checkout URL
  // For now, we'll return a mock URL
  
  console.log('[shopifyService] Generating checkout URL for book:', book.id, 'variant:', variant);
  
  // The actual Shopify store URL would come from environment variables
  const shopifyStoreUrl = process.env.REACT_APP_SHOPIFY_STORE_URL || 'https://your-shopify-store.myshopify.com';
  
  return `${shopifyStoreUrl}/cart/add?id=${book.id}&variant=${variant}`;
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
      return await processPrintOrder(order, isExpedited);
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
 * @returns {Promise<Object>} - The processing result with Lulu job ID
 */
const processPrintOrder = async (order, isExpedited = false) => {
  try {
    console.log('[shopifyService] Processing print order:', order.id, 'expedited:', isExpedited);
    
    // Get the book ID from the order
    const bookId = order.line_items[0].product_id;
    
    // In a production environment, we would fetch the book data from the database
    // For now, we'll assume we have the book data
    const book = order.book; // This would come from the database in production
    
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
    const interiorPdfBuffer = await generatePrintInteriorPDF(book);
    
    // Upload the interior PDF to Supabase or another storage service
    const interiorFilename = `${book.id}_interior_${Date.now()}.pdf`;
    const interiorPdfUrl = await uploadFileToSupabase(
      new Blob([interiorPdfBuffer], { type: 'application/pdf' }),
      interiorFilename,
      'print-files'
    );
    
    // Calculate the cover dimensions
    const pageCount = book.pages.filter(page => page.type === 'content').length;
    const coverDimensions = await calculateCoverDimensions(podPackageId, pageCount);
    
    // Generate the print-ready cover PDF
    const coverPdfBuffer = await generatePrintCoverPDF(book, coverDimensions);
    
    // Upload the cover PDF to Supabase or another storage service
    const coverFilename = `${book.id}_cover_${Date.now()}.pdf`;
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
        id: book.id,
        title: book.title,
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
        
      default:
        console.log('[shopifyService] Unhandled webhook topic:', webhook.topic);
        return { status: 'ignored', topic: webhook.topic };
    }
  } catch (error) {
    console.error('[shopifyService] Error handling Shopify webhook:', error);
    throw error;
  }
};
