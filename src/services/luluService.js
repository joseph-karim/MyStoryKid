/**
 * Lulu Direct API Service
 * 
 * This service handles the integration with Lulu Direct API for print-on-demand
 * book printing and fulfillment.
 */

import { secureApiService } from './secureApiService';

/**
 * Gets an access token from Lulu API (now handled by edge function)
 * @returns {Promise<string>} - The access token (if needed, but usually handled server-side)
 */
export const getLuluToken = async () => {
  throw new Error('Direct token access is not supported client-side. All Lulu API calls must go through the edge function.');
};

/**
 * Validates an interior PDF file with Lulu API
 * @param {string} fileUrl - Publicly accessible URL to the PDF
 * @param {string} podPackageId - The POD package ID (optional)
 * @returns {Promise<Object>} - Validation result
 */
export const validateInteriorFile = async (fileUrl, podPackageId = null) => {
  return secureApiService.callLuluAPI('/validate-interior/', 'POST', {
    source_url: fileUrl,
    ...(podPackageId ? { pod_package_id: podPackageId } : {})
  });
};

/**
 * Calculates cover dimensions using Lulu API
 * @param {string} podPackageId - The POD package ID
 * @param {number} pageCount - The number of interior pages
 * @returns {Promise<Object>} - Cover dimensions
 */
export const calculateCoverDimensions = async (podPackageId, pageCount) => {
  return secureApiService.callLuluAPI('/cover-dimensions/', 'POST', {
    pod_package_id: podPackageId,
    interior_page_count: pageCount
  });
};

/**
 * Validates a cover PDF file with Lulu API
 * @param {string} fileUrl - Publicly accessible URL to the PDF
 * @param {string} podPackageId - The POD package ID
 * @param {number} pageCount - The number of interior pages
 * @returns {Promise<Object>} - Validation result
 */
export const validateCoverFile = async (fileUrl, podPackageId, pageCount) => {
  return secureApiService.callLuluAPI('/validate-cover/', 'POST', {
    source_url: fileUrl,
    pod_package_id: podPackageId,
    interior_page_count: pageCount
  });
};

/**
 * Calculates shipping costs for a print job
 * @param {Object} bookData - Book data including POD package ID and page count
 * @param {Object} shippingAddress - Customer shipping address
 * @returns {Promise<Object>} - Shipping options with costs
 */
export const calculateShippingCosts = async (bookData, shippingAddress) => {
  return secureApiService.callLuluAPI('/shipping-options/', 'POST', {
    line_items: [
      {
        page_count: bookData.pageCount,
        quantity: 1,
        pod_package_id: bookData.podPackageId
      }
    ],
    shipping_address: {
      city: shippingAddress.city,
      country_code: shippingAddress.country_code,
      postcode: shippingAddress.postcode,
      state_code: shippingAddress.state_code || '',
      street1: shippingAddress.street1
    }
  });
};

/**
 * Creates a print job with Lulu API
 * @param {Object} bookData - Book data including interior and cover PDFs
 * @param {Object} shippingAddress - Customer shipping address
 * @param {string} shippingLevel - Shipping level (MAIL, GROUND, etc.)
 * @returns {Promise<Object>} - Print job result
 */
export const createPrintJob = async (bookData, shippingAddress, shippingLevel = 'MAIL') => {
  return secureApiService.callLuluAPI('/print-jobs/', 'POST', {
    contact_email: bookData.contactEmail || 'contact@mystorykid.com',
    external_id: `mystorykid-${bookData.id}`,
    line_items: [
      {
        title: bookData.title,
        quantity: 1,
        printable_normalization: {
          cover: { source_url: bookData.coverUrl },
          interior: { source_url: bookData.interiorUrl },
          pod_package_id: bookData.podPackageId
        }
      }
    ],
    shipping_address: {
      name: shippingAddress.name,
      street1: shippingAddress.street1,
      city: shippingAddress.city,
      country_code: shippingAddress.country_code,
      postcode: shippingAddress.postcode,
      phone_number: shippingAddress.phone_number,
      state_code: shippingAddress.state_code || ''
    },
    shipping_level: shippingLevel,
    production_delay: 120
  });
};

/**
 * Gets the status of a print job
 * @param {string} printJobId - The print job ID
 * @returns {Promise<Object>} - Print job status
 */
export const getPrintJobStatus = async (printJobId) => {
  return secureApiService.callLuluAPI(`/print-jobs/${printJobId}/status/`, 'GET');
};

/**
 * Gets the details of a print job
 * @param {string} printJobId - The print job ID
 * @returns {Promise<Object>} - Print job details
 */
export const getPrintJobDetails = async (printJobId) => {
  return secureApiService.callLuluAPI(`/print-jobs/${printJobId}/`, 'GET');
};

/**
 * Gets all print jobs for the account
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.size - Page size (default: 25)
 * @param {string} options.status - Filter by status
 * @returns {Promise<Object>} - List of print jobs
 */
export const getAllPrintJobs = async (options = {}) => {
  const queryParams = new URLSearchParams();
  if (options.page) queryParams.append('page', options.page);
  if (options.size) queryParams.append('size', options.size);
  if (options.status) queryParams.append('status', options.status);
  const url = `/print-jobs/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return secureApiService.callLuluAPI(url, 'GET');
};

/**
 * Gets tracking information for a print job
 * @param {string} printJobId - The print job ID
 * @returns {Promise<Object>} - Tracking information
 */
export const getPrintJobTracking = async (printJobId) => {
  return secureApiService.callLuluAPI(`/print-jobs/${printJobId}/tracking/`, 'GET');
};

/**
 * Gets shipping information for a print job
 * @param {string} printJobId - The print job ID
 * @returns {Promise<Object>} - Shipping information
 */
export const getPrintJobShipping = async (printJobId) => {
  return secureApiService.callLuluAPI(`/print-jobs/${printJobId}/shipping/`, 'GET');
};

/**
 * Gets comprehensive order information including status, tracking, and shipping
 * @param {string} printJobId - The print job ID
 * @returns {Promise<Object>} - Complete order information
 */
export const getCompleteOrderInfo = async (printJobId) => {
  // Get all order information in parallel
  const [details, status, tracking, shipping] = await Promise.allSettled([
    getPrintJobDetails(printJobId),
    getPrintJobStatus(printJobId),
    getPrintJobTracking(printJobId),
    getPrintJobShipping(printJobId)
  ]);
  const orderInfo = {
    printJobId,
    details: details.status === 'fulfilled' ? details.value : null,
    status: status.status === 'fulfilled' ? status.value : null,
    tracking: tracking.status === 'fulfilled' ? tracking.value : null,
    shipping: shipping.status === 'fulfilled' ? shipping.value : null,
    errors: []
  };
  if (details.status === 'rejected') orderInfo.errors.push({ type: 'details', error: details.reason.message });
  if (status.status === 'rejected') orderInfo.errors.push({ type: 'status', error: status.reason.message });
  if (tracking.status === 'rejected') orderInfo.errors.push({ type: 'tracking', error: tracking.reason.message });
  if (shipping.status === 'rejected') orderInfo.errors.push({ type: 'shipping', error: shipping.reason.message });
  return orderInfo;
};

/**
 * Formats order status for display
 * @param {Object} orderInfo - Complete order information
 * @returns {Object} - Formatted order status
 */
export const formatOrderStatus = (orderInfo) => {
  if (!orderInfo) return null;
  
  const { details, status, tracking, shipping } = orderInfo;
  
  // Determine overall status
  let overallStatus = 'unknown';
  let statusMessage = 'Status unknown';
  let estimatedDelivery = null;
  let trackingNumber = null;
  let carrier = null;
  
  if (status) {
    overallStatus = status.status?.toLowerCase() || 'unknown';
    
    switch (overallStatus) {
      case 'created':
        statusMessage = 'Order received and being processed';
        break;
      case 'in_production':
        statusMessage = 'Your book is being printed';
        break;
      case 'shipped':
        statusMessage = 'Your book has been shipped';
        break;
      case 'delivered':
        statusMessage = 'Your book has been delivered';
        break;
      case 'cancelled':
        statusMessage = 'Order has been cancelled';
        break;
      case 'rejected':
        statusMessage = 'Order was rejected - please contact support';
        break;
      default:
        statusMessage = `Order status: ${overallStatus}`;
    }
  }
  
  // Extract tracking information
  if (tracking) {
    trackingNumber = tracking.tracking_number;
    carrier = tracking.carrier;
  }
  
  // Extract shipping information
  if (shipping) {
    estimatedDelivery = shipping.estimated_delivery_date;
  }
  
  // Extract order details
  const orderDetails = details ? {
    id: details.id,
    externalId: details.external_id,
    createdAt: details.created_at,
    lineItems: details.line_items || [],
    shippingAddress: details.shipping_address,
    contactEmail: details.contact_email
  } : null;
  
  return {
    printJobId: orderInfo.printJobId,
    overallStatus,
    statusMessage,
    estimatedDelivery,
    trackingNumber,
    carrier,
    orderDetails,
    lastUpdated: new Date().toISOString(),
    errors: orderInfo.errors
  };
};
