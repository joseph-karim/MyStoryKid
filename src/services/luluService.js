/**
 * Lulu Direct API Service
 * 
 * This service handles the integration with Lulu Direct API for print-on-demand
 * book printing and fulfillment.
 */

/**
 * Gets an access token from Lulu API
 * @returns {Promise<string>} - The access token
 */
export const getLuluToken = async () => {
  try {
    console.log('[luluService] Getting Lulu API token');
    
    // Get credentials from environment variables
    const clientKey = import.meta.env.VITE_LULU_CLIENT_KEY;
    const clientSecret = import.meta.env.VITE_LULU_CLIENT_SECRET;
    
    if (!clientKey || !clientSecret) {
      console.warn('[luluService] Lulu API credentials not configured');
      throw new Error('Lulu API credentials not configured');
    }
    
    const authString = import.meta.env.VITE_LULU_BASE64_AUTH || btoa(`${clientKey}:${clientSecret}`);
    
    const response = await fetch('https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get Lulu token: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[luluService] Successfully obtained Lulu API token');
    
    return data.access_token;
  } catch (error) {
    console.error('[luluService] Error getting Lulu token:', error);
    throw error;
  }
};

/**
 * Validates an interior PDF file with Lulu API
 * @param {string} fileUrl - Publicly accessible URL to the PDF
 * @param {string} podPackageId - The POD package ID (optional)
 * @returns {Promise<Object>} - Validation result
 */
export const validateInteriorFile = async (fileUrl, podPackageId = null) => {
  try {
    console.log('[luluService] Validating interior file:', fileUrl);
    
    const token = await getLuluToken();
    
    const payload = {
      source_url: fileUrl
    };
    
    // Add pod_package_id if provided
    if (podPackageId) {
      payload.pod_package_id = podPackageId;
    }
    
    const response = await fetch('https://api.lulu.com/validate-interior/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to validate interior file: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('[luluService] Interior file validation result:', result);
    
    return result;
  } catch (error) {
    console.error('[luluService] Error validating interior file:', error);
    throw error;
  }
};

/**
 * Calculates cover dimensions using Lulu API
 * @param {string} podPackageId - The POD package ID
 * @param {number} pageCount - The number of interior pages
 * @returns {Promise<Object>} - Cover dimensions
 */
export const calculateCoverDimensions = async (podPackageId, pageCount) => {
  try {
    console.log('[luluService] Calculating cover dimensions for:', { podPackageId, pageCount });
    
    const token = await getLuluToken();
    
    const response = await fetch('https://api.lulu.com/cover-dimensions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        pod_package_id: podPackageId,
        interior_page_count: pageCount
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to calculate cover dimensions: ${response.statusText}`);
    }
    
    const dimensions = await response.json();
    console.log('[luluService] Cover dimensions:', dimensions);
    
    return dimensions;
  } catch (error) {
    console.error('[luluService] Error calculating cover dimensions:', error);
    throw error;
  }
};

/**
 * Validates a cover PDF file with Lulu API
 * @param {string} fileUrl - Publicly accessible URL to the PDF
 * @param {string} podPackageId - The POD package ID
 * @param {number} pageCount - The number of interior pages
 * @returns {Promise<Object>} - Validation result
 */
export const validateCoverFile = async (fileUrl, podPackageId, pageCount) => {
  try {
    console.log('[luluService] Validating cover file:', fileUrl);
    
    const token = await getLuluToken();
    
    const response = await fetch('https://api.lulu.com/validate-cover/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        source_url: fileUrl,
        pod_package_id: podPackageId,
        interior_page_count: pageCount
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to validate cover file: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('[luluService] Cover file validation result:', result);
    
    return result;
  } catch (error) {
    console.error('[luluService] Error validating cover file:', error);
    throw error;
  }
};

/**
 * Calculates shipping costs for a print job
 * @param {Object} bookData - Book data including POD package ID and page count
 * @param {Object} shippingAddress - Customer shipping address
 * @returns {Promise<Object>} - Shipping options with costs
 */
export const calculateShippingCosts = async (bookData, shippingAddress) => {
  try {
    console.log('[luluService] Calculating shipping costs');
    
    const token = await getLuluToken();
    
    const response = await fetch('https://api.lulu.com/shipping-options/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
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
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to calculate shipping costs: ${response.statusText}`);
    }
    
    const shippingOptions = await response.json();
    console.log('[luluService] Shipping options:', shippingOptions);
    
    return shippingOptions;
  } catch (error) {
    console.error('[luluService] Error calculating shipping costs:', error);
    throw error;
  }
};

/**
 * Creates a print job with Lulu API
 * @param {Object} bookData - Book data including interior and cover PDFs
 * @param {Object} shippingAddress - Customer shipping address
 * @param {string} shippingLevel - Shipping level (MAIL, GROUND, etc.)
 * @returns {Promise<Object>} - Print job result
 */
export const createPrintJob = async (bookData, shippingAddress, shippingLevel = 'MAIL') => {
  try {
    console.log('[luluService] Creating print job');
    
    const token = await getLuluToken();
    
    // Create the print job payload
    const payload = {
      contact_email: import.meta.env.VITE_LULU_CONTACT_EMAIL || 'contact@mystorykid.com',
      external_id: `mystorykid-${bookData.id}`,
      line_items: [
        {
          title: bookData.title,
          quantity: 1,
          printable_normalization: {
            cover: {
              source_url: bookData.coverUrl
            },
            interior: {
              source_url: bookData.interiorUrl
            },
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
      production_delay: 120 // 2 hours
    };
    
    const response = await fetch('https://api.lulu.com/print-jobs/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create print job: ${response.statusText}`);
    }
    
    const printJob = await response.json();
    console.log('[luluService] Print job created:', printJob);
    
    return printJob;
  } catch (error) {
    console.error('[luluService] Error creating print job:', error);
    throw error;
  }
};

/**
 * Gets the status of a print job
 * @param {string} printJobId - The print job ID
 * @returns {Promise<Object>} - Print job status
 */
export const getPrintJobStatus = async (printJobId) => {
  try {
    console.log('[luluService] Getting print job status:', printJobId);
    
    const token = await getLuluToken();
    
    const response = await fetch(`https://api.lulu.com/print-jobs/${printJobId}/status/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get print job status: ${response.statusText}`);
    }
    
    const status = await response.json();
    console.log('[luluService] Print job status:', status);
    
    return status;
  } catch (error) {
    console.error('[luluService] Error getting print job status:', error);
    throw error;
  }
};

/**
 * Gets the details of a print job
 * @param {string} printJobId - The print job ID
 * @returns {Promise<Object>} - Print job details
 */
export const getPrintJobDetails = async (printJobId) => {
  try {
    console.log('[luluService] Getting print job details:', printJobId);
    
    const token = await getLuluToken();
    
    const response = await fetch(`https://api.lulu.com/print-jobs/${printJobId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get print job details: ${response.statusText}`);
    }
    
    const details = await response.json();
    console.log('[luluService] Print job details:', details);
    
    return details;
  } catch (error) {
    console.error('[luluService] Error getting print job details:', error);
    throw error;
  }
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
  try {
    console.log('[luluService] Getting all print jobs with options:', options);
    
    const token = await getLuluToken();
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (options.page) queryParams.append('page', options.page);
    if (options.size) queryParams.append('size', options.size);
    if (options.status) queryParams.append('status', options.status);
    
    const url = `https://api.lulu.com/print-jobs/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get print jobs: ${response.statusText}`);
    }
    
    const jobs = await response.json();
    console.log('[luluService] Print jobs retrieved:', jobs.results?.length || 0);
    
    return jobs;
  } catch (error) {
    console.error('[luluService] Error getting print jobs:', error);
    throw error;
  }
};

/**
 * Gets tracking information for a print job
 * @param {string} printJobId - The print job ID
 * @returns {Promise<Object>} - Tracking information
 */
export const getPrintJobTracking = async (printJobId) => {
  try {
    console.log('[luluService] Getting print job tracking:', printJobId);
    
    const token = await getLuluToken();
    
    const response = await fetch(`https://api.lulu.com/print-jobs/${printJobId}/tracking/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get print job tracking: ${response.statusText}`);
    }
    
    const tracking = await response.json();
    console.log('[luluService] Print job tracking:', tracking);
    
    return tracking;
  } catch (error) {
    console.error('[luluService] Error getting print job tracking:', error);
    throw error;
  }
};

/**
 * Gets shipping information for a print job
 * @param {string} printJobId - The print job ID
 * @returns {Promise<Object>} - Shipping information
 */
export const getPrintJobShipping = async (printJobId) => {
  try {
    console.log('[luluService] Getting print job shipping info:', printJobId);
    
    const token = await getLuluToken();
    
    const response = await fetch(`https://api.lulu.com/print-jobs/${printJobId}/shipping/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get print job shipping: ${response.statusText}`);
    }
    
    const shipping = await response.json();
    console.log('[luluService] Print job shipping:', shipping);
    
    return shipping;
  } catch (error) {
    console.error('[luluService] Error getting print job shipping:', error);
    throw error;
  }
};

/**
 * Gets comprehensive order information including status, tracking, and shipping
 * @param {string} printJobId - The print job ID
 * @returns {Promise<Object>} - Complete order information
 */
export const getCompleteOrderInfo = async (printJobId) => {
  try {
    console.log('[luluService] Getting complete order info for:', printJobId);
    
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
    
    // Collect any errors
    if (details.status === 'rejected') orderInfo.errors.push({ type: 'details', error: details.reason.message });
    if (status.status === 'rejected') orderInfo.errors.push({ type: 'status', error: status.reason.message });
    if (tracking.status === 'rejected') orderInfo.errors.push({ type: 'tracking', error: tracking.reason.message });
    if (shipping.status === 'rejected') orderInfo.errors.push({ type: 'shipping', error: shipping.reason.message });
    
    console.log('[luluService] Complete order info retrieved with', orderInfo.errors.length, 'errors');
    
    return orderInfo;
  } catch (error) {
    console.error('[luluService] Error getting complete order info:', error);
    throw error;
  }
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
