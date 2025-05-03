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
