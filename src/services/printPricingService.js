/**
 * Print Pricing Service
 * 
 * This service calculates accurate print pricing based on actual book specifications,
 * integrating Lulu Direct costs with Shopify checkout for transparent pricing.
 */

import { calculateShippingCosts } from './luluService';
import { getEnhancementCostEstimate } from './printReadyBookService';

// Base pricing configuration
const PRICING_CONFIG = {
  // Markup percentages
  baseMarkup: 0.40, // 40% markup on base costs
  shippingMarkup: 0.15, // 15% markup on shipping
  
  // Minimum prices to ensure profitability
  minimumPrintPrice: 19.99,
  minimumDigitalPrice: 9.99,
  
  // POD Package mapping based on book specifications
  podPackages: {
    // Standard paperback sizes
    '6x9_paperback_bw': '0600X0900BWSTDPB060UW444MXX',
    '6x9_paperback_color': '0600X0900FCSTDPB060UW444MXX',
    '8x10_paperback_color': '0800X1000FCSTDPB060UW444MXX',
    '8.5x11_paperback_color': '0850X1100FCSTDPB060UW444MXX',
    
    // Hardcover options
    '6x9_hardcover_color': '0600X0900FCHCSTD060UW444MXX',
    '8x10_hardcover_color': '0800X1000FCHCSTD060UW444MXX'
  },
  
  // Base printing costs (estimated from Lulu's pricing)
  basePrintingCosts: {
    '6x9_paperback_bw': { setup: 0.90, perPage: 0.012 },
    '6x9_paperback_color': { setup: 2.15, perPage: 0.06 },
    '8x10_paperback_color': { setup: 2.65, perPage: 0.085 },
    '8.5x11_paperback_color': { setup: 3.15, perPage: 0.095 },
    '6x9_hardcover_color': { setup: 4.85, perPage: 0.06 },
    '8x10_hardcover_color': { setup: 5.35, perPage: 0.085 }
  }
};

/**
 * Determines the appropriate POD package based on book specifications
 * @param {Object} book - The book object
 * @returns {Object} - POD package information
 */
export const determinePODPackage = (book) => {
  // Default to 6x9 color paperback for children's books
  let packageType = '6x9_paperback_color';
  
  // Analyze book content to determine if color is needed
  const hasColorImages = book.pages?.some(page => 
    page.imageUrl && !page.isBlackAndWhite
  );
  
  // Determine size based on page count and content type
  const pageCount = book.pages?.filter(page => page.type === 'content')?.length || 20;
  
  if (pageCount > 40) {
    // Larger books might benefit from larger format
    packageType = hasColorImages ? '8x10_paperback_color' : '6x9_paperback_bw';
  } else {
    // Standard size for most children's books
    packageType = hasColorImages ? '6x9_paperback_color' : '6x9_paperback_bw';
  }
  
  return {
    type: packageType,
    podPackageId: PRICING_CONFIG.podPackages[packageType],
    isColor: hasColorImages,
    recommendedSize: packageType.includes('8x10') ? '8"x10"' : '6"x9"',
    bindingType: packageType.includes('hardcover') ? 'hardcover' : 'paperback'
  };
};

/**
 * Calculates the base printing cost for a book
 * @param {Object} book - The book object
 * @param {Object} podPackage - POD package information
 * @returns {Object} - Base printing cost breakdown
 */
export const calculateBasePrintingCost = (book, podPackage) => {
  const pageCount = book.pages?.filter(page => page.type === 'content')?.length || 20;
  const costConfig = PRICING_CONFIG.basePrintingCosts[podPackage.type];
  
  if (!costConfig) {
    throw new Error(`No cost configuration found for package type: ${podPackage.type}`);
  }
  
  const setupCost = costConfig.setup;
  const pageCost = pageCount * costConfig.perPage;
  const baseCost = setupCost + pageCost;
  
  return {
    setupCost,
    pageCost,
    pageCount,
    baseCost,
    costPerPage: costConfig.perPage
  };
};

/**
 * Calculates comprehensive pricing for a book including all options
 * @param {Object} book - The book object
 * @param {Object} shippingAddress - Customer shipping address
 * @param {Object} options - Pricing options
 * @returns {Promise<Object>} - Complete pricing breakdown
 */
export const calculateComprehensivePricing = async (book, shippingAddress, options = {}) => {
  try {
    console.log('[printPricingService] Calculating comprehensive pricing for book:', book.id);
    
    // Determine POD package
    const podPackage = determinePODPackage(book);
    
    // Calculate base printing cost
    const basePrinting = calculateBasePrintingCost(book, podPackage);
    
    // Calculate shipping costs using Lulu API
    let shippingCosts = null;
    let shippingError = null;
    
    try {
      shippingCosts = await calculateShippingCosts(
        {
          pageCount: basePrinting.pageCount,
          podPackageId: podPackage.podPackageId
        },
        shippingAddress
      );
    } catch (error) {
      console.warn('[printPricingService] Failed to get real shipping costs, using estimates:', error);
      shippingError = error.message;
      
      // Fallback shipping estimates
      shippingCosts = {
        shipping_options: [
          {
            id: 'MAIL',
            name: 'Standard Shipping',
            cost: { total: '4.99', currency: 'USD' },
            delivery_time: '5-7 business days'
          },
          {
            id: 'EXPEDITED',
            name: 'Expedited Shipping',
            cost: { total: '9.99', currency: 'USD' },
            delivery_time: '2-3 business days'
          }
        ]
      };
    }
    
    // Calculate enhancement costs if requested
    let enhancementCosts = null;
    if (options.includeEnhancement) {
      try {
        enhancementCosts = await getEnhancementCostEstimate(book);
      } catch (error) {
        console.warn('[printPricingService] Failed to get enhancement costs:', error);
        enhancementCosts = { totalCost: 2.50, perImageCost: 0.25 }; // Fallback
      }
    }
    
    // Calculate final pricing with markup
    const basePrice = basePrinting.baseCost * (1 + PRICING_CONFIG.baseMarkup);
    const finalBasePrice = Math.max(basePrice, PRICING_CONFIG.minimumPrintPrice);
    
    // Process shipping options
    const processedShippingOptions = shippingCosts.shipping_options?.map(option => {
      const shippingCost = parseFloat(option.cost.total);
      const markedUpShipping = shippingCost * (1 + PRICING_CONFIG.shippingMarkup);
      
      return {
        id: option.id,
        name: option.name,
        originalCost: shippingCost,
        finalCost: Math.round(markedUpShipping * 100) / 100,
        deliveryTime: option.delivery_time,
        currency: option.cost.currency
      };
    }) || [];
    
    // Calculate total prices for each option
    const pricingOptions = {
      digital: {
        price: PRICING_CONFIG.minimumDigitalPrice,
        currency: 'USD',
        description: 'Instant download PDF'
      },
      
      print: processedShippingOptions.map(shipping => {
        const baseTotal = finalBasePrice + shipping.finalCost;
        const enhancedTotal = enhancementCosts ? 
          baseTotal + enhancementCosts.totalCost : baseTotal;
        
        return {
          id: `print-${shipping.id.toLowerCase()}`,
          name: `Printed Book - ${shipping.name}`,
          basePrice: Math.round(baseTotal * 100) / 100,
          enhancedPrice: enhancementCosts ? 
            Math.round(enhancedTotal * 100) / 100 : null,
          shipping: shipping,
          deliveryTime: shipping.deliveryTime,
          currency: 'USD'
        };
      })
    };
    
    return {
      success: true,
      data: {
        book: {
          id: book.id,
          title: book.title,
          pageCount: basePrinting.pageCount
        },
        podPackage,
        basePrinting,
        enhancementCosts,
        pricingOptions,
        breakdown: {
          basePrintingCost: basePrinting.baseCost,
          markup: PRICING_CONFIG.baseMarkup,
          finalBasePrice,
          shippingOptions: processedShippingOptions,
          enhancementAvailable: !!enhancementCosts
        },
        metadata: {
          calculatedAt: new Date().toISOString(),
          shippingAddress: {
            city: shippingAddress.city,
            country: shippingAddress.country_code,
            state: shippingAddress.state_code
          },
          shippingError
        }
      }
    };
    
  } catch (error) {
    console.error('[printPricingService] Error calculating comprehensive pricing:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Gets pricing for Shopify product creation
 * @param {Object} book - The book object
 * @param {Object} shippingAddress - Default shipping address for cost estimation
 * @returns {Promise<Object>} - Shopify-compatible pricing data
 */
export const getShopifyPricing = async (book, shippingAddress) => {
  try {
    const pricingResult = await calculateComprehensivePricing(book, shippingAddress, {
      includeEnhancement: true
    });
    
    if (!pricingResult.success) {
      throw new Error(pricingResult.error);
    }
    
    const { pricingOptions, enhancementCosts } = pricingResult.data;
    
    // Format for Shopify product variants
    const variants = [
      {
        title: 'Digital Download',
        sku: 'digital',
        price: pricingOptions.digital.price,
        requires_shipping: false,
        inventory_management: null,
        inventory_policy: 'continue'
      }
    ];
    
    // Add print variants
    pricingOptions.print.forEach(printOption => {
      variants.push({
        title: printOption.name,
        sku: printOption.id,
        price: printOption.basePrice,
        requires_shipping: true,
        inventory_management: null,
        inventory_policy: 'continue',
        weight: 0.5,
        weight_unit: 'lb'
      });
      
      // Add enhanced variant if enhancement is available
      if (printOption.enhancedPrice) {
        variants.push({
          title: `${printOption.name} (Enhanced)`,
          sku: `${printOption.id}-enhanced`,
          price: printOption.enhancedPrice,
          requires_shipping: true,
          inventory_management: null,
          inventory_policy: 'continue',
          weight: 0.5,
          weight_unit: 'lb'
        });
      }
    });
    
    return {
      success: true,
      data: {
        variants,
        digitalPrice: pricingOptions.digital.price,
        printPrices: pricingOptions.print.map(p => ({
          variant: p.id,
          basePrice: p.basePrice,
          enhancedPrice: p.enhancedPrice
        })),
        enhancementCost: enhancementCosts?.totalCost || 0,
        podPackage: pricingResult.data.podPackage
      }
    };
    
  } catch (error) {
    console.error('[printPricingService] Error getting Shopify pricing:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Validates pricing data for accuracy
 * @param {Object} pricingData - Pricing data to validate
 * @returns {Object} - Validation result
 */
export const validatePricing = (pricingData) => {
  const errors = [];
  const warnings = [];
  
  if (!pricingData.success) {
    errors.push('Pricing calculation failed');
    return { isValid: false, errors, warnings };
  }
  
  const { pricingOptions, breakdown } = pricingData.data;
  
  // Validate digital pricing
  if (pricingOptions.digital.price < PRICING_CONFIG.minimumDigitalPrice) {
    warnings.push(`Digital price below minimum: $${pricingOptions.digital.price}`);
  }
  
  // Validate print pricing
  pricingOptions.print.forEach(option => {
    if (option.basePrice < PRICING_CONFIG.minimumPrintPrice) {
      warnings.push(`Print price below minimum for ${option.name}: $${option.basePrice}`);
    }
    
    if (option.shipping.finalCost <= 0) {
      errors.push(`Invalid shipping cost for ${option.name}`);
    }
  });
  
  // Validate markup
  if (breakdown.markup < 0.2) {
    warnings.push('Markup below recommended 20% minimum');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}; 