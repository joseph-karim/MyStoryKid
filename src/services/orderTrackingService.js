/**
 * Order Tracking Service
 * 
 * This service manages order tracking integration between Lulu Direct API
 * and the MyStoryKid application, providing comprehensive order status
 * and tracking information for the user dashboard.
 */

import { 
  getCompleteOrderInfo, 
  formatOrderStatus, 
  getAllPrintJobs,
  getPrintJobStatus,
  getPrintJobTracking 
} from './luluService';

/**
 * Gets order tracking information for a specific order
 * @param {string} printJobId - The Lulu print job ID
 * @returns {Promise<Object>} - Formatted order tracking information
 */
export const getOrderTracking = async (printJobId) => {
  try {
    console.log('[orderTrackingService] Getting order tracking for:', printJobId);
    
    const orderInfo = await getCompleteOrderInfo(printJobId);
    const formattedStatus = formatOrderStatus(orderInfo);
    
    return {
      success: true,
      data: formattedStatus,
      errors: orderInfo.errors
    };
  } catch (error) {
    console.error('[orderTrackingService] Error getting order tracking:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Gets tracking information for multiple orders
 * @param {Array<string>} printJobIds - Array of Lulu print job IDs
 * @returns {Promise<Object>} - Tracking information for all orders
 */
export const getMultipleOrderTracking = async (printJobIds) => {
  try {
    console.log('[orderTrackingService] Getting tracking for multiple orders:', printJobIds.length);
    
    const trackingPromises = printJobIds.map(async (printJobId) => {
      try {
        const result = await getOrderTracking(printJobId);
        return { printJobId, ...result };
      } catch (error) {
        return {
          printJobId,
          success: false,
          error: error.message,
          data: null
        };
      }
    });
    
    const results = await Promise.all(trackingPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    return {
      success: true,
      data: {
        orders: successful.map(r => ({ printJobId: r.printJobId, ...r.data })),
        totalOrders: results.length,
        successfulOrders: successful.length,
        failedOrders: failed.length,
        errors: failed.map(r => ({ printJobId: r.printJobId, error: r.error }))
      }
    };
  } catch (error) {
    console.error('[orderTrackingService] Error getting multiple order tracking:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Gets all orders for the account with tracking information
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - All orders with tracking
 */
export const getAllOrdersWithTracking = async (options = {}) => {
  try {
    console.log('[orderTrackingService] Getting all orders with tracking');
    
    // Get all print jobs from Lulu
    const printJobs = await getAllPrintJobs(options);
    
    if (!printJobs.results || printJobs.results.length === 0) {
      return {
        success: true,
        data: {
          orders: [],
          totalOrders: 0,
          pagination: {
            page: options.page || 1,
            size: options.size || 25,
            total: 0
          }
        }
      };
    }
    
    // Get tracking information for each order
    const printJobIds = printJobs.results.map(job => job.id);
    const trackingResult = await getMultipleOrderTracking(printJobIds);
    
    if (!trackingResult.success) {
      throw new Error(trackingResult.error);
    }
    
    return {
      success: true,
      data: {
        orders: trackingResult.data.orders,
        totalOrders: printJobs.total || printJobs.results.length,
        pagination: {
          page: options.page || 1,
          size: options.size || 25,
          total: printJobs.total || printJobs.results.length
        },
        errors: trackingResult.data.errors
      }
    };
  } catch (error) {
    console.error('[orderTrackingService] Error getting all orders with tracking:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Gets orders filtered by status
 * @param {string} status - Order status to filter by
 * @param {Object} options - Additional query options
 * @returns {Promise<Object>} - Filtered orders with tracking
 */
export const getOrdersByStatus = async (status, options = {}) => {
  try {
    console.log('[orderTrackingService] Getting orders by status:', status);
    
    const result = await getAllOrdersWithTracking({ ...options, status });
    
    if (!result.success) {
      return result;
    }
    
    // Additional client-side filtering if needed
    const filteredOrders = result.data.orders.filter(order => 
      order.overallStatus === status.toLowerCase()
    );
    
    return {
      success: true,
      data: {
        ...result.data,
        orders: filteredOrders,
        filteredBy: status
      }
    };
  } catch (error) {
    console.error('[orderTrackingService] Error getting orders by status:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Refreshes tracking information for a specific order
 * @param {string} printJobId - The Lulu print job ID
 * @returns {Promise<Object>} - Updated tracking information
 */
export const refreshOrderTracking = async (printJobId) => {
  try {
    console.log('[orderTrackingService] Refreshing order tracking for:', printJobId);
    
    // Force fresh data by calling the API directly
    const [status, tracking] = await Promise.allSettled([
      getPrintJobStatus(printJobId),
      getPrintJobTracking(printJobId)
    ]);
    
    const refreshedInfo = {
      printJobId,
      status: status.status === 'fulfilled' ? status.value : null,
      tracking: tracking.status === 'fulfilled' ? tracking.value : null,
      lastRefreshed: new Date().toISOString(),
      errors: []
    };
    
    if (status.status === 'rejected') {
      refreshedInfo.errors.push({ type: 'status', error: status.reason.message });
    }
    if (tracking.status === 'rejected') {
      refreshedInfo.errors.push({ type: 'tracking', error: tracking.reason.message });
    }
    
    return {
      success: true,
      data: refreshedInfo
    };
  } catch (error) {
    console.error('[orderTrackingService] Error refreshing order tracking:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Gets order summary statistics
 * @returns {Promise<Object>} - Order statistics
 */
export const getOrderStatistics = async () => {
  try {
    console.log('[orderTrackingService] Getting order statistics');
    
    const allOrdersResult = await getAllOrdersWithTracking({ size: 100 }); // Get more orders for stats
    
    if (!allOrdersResult.success) {
      throw new Error(allOrdersResult.error);
    }
    
    const orders = allOrdersResult.data.orders;
    
    const stats = {
      totalOrders: orders.length,
      ordersByStatus: {},
      recentOrders: orders
        .filter(order => order.orderDetails?.createdAt)
        .sort((a, b) => new Date(b.orderDetails.createdAt) - new Date(a.orderDetails.createdAt))
        .slice(0, 5),
      ordersWithTracking: orders.filter(order => order.trackingNumber).length,
      ordersInTransit: orders.filter(order => 
        order.overallStatus === 'shipped' && !order.overallStatus === 'delivered'
      ).length
    };
    
    // Count orders by status
    orders.forEach(order => {
      const status = order.overallStatus || 'unknown';
      stats.ordersByStatus[status] = (stats.ordersByStatus[status] || 0) + 1;
    });
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('[orderTrackingService] Error getting order statistics:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Formats tracking information for display in UI components
 * @param {Object} orderData - Order tracking data
 * @returns {Object} - UI-formatted tracking information
 */
export const formatTrackingForUI = (orderData) => {
  if (!orderData) return null;
  
  const {
    printJobId,
    overallStatus,
    statusMessage,
    estimatedDelivery,
    trackingNumber,
    carrier,
    orderDetails,
    lastUpdated
  } = orderData;
  
  // Determine status color and icon
  let statusColor = 'gray';
  let statusIcon = '📦';
  
  switch (overallStatus) {
    case 'created':
      statusColor = 'blue';
      statusIcon = '📝';
      break;
    case 'in_production':
      statusColor = 'yellow';
      statusIcon = '🖨️';
      break;
    case 'shipped':
      statusColor = 'purple';
      statusIcon = '🚚';
      break;
    case 'delivered':
      statusColor = 'green';
      statusIcon = '✅';
      break;
    case 'cancelled':
      statusColor = 'red';
      statusIcon = '❌';
      break;
    case 'rejected':
      statusColor = 'red';
      statusIcon = '⚠️';
      break;
  }
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  
  return {
    printJobId,
    status: {
      code: overallStatus,
      message: statusMessage,
      color: statusColor,
      icon: statusIcon
    },
    tracking: {
      number: trackingNumber,
      carrier: carrier,
      hasTracking: !!trackingNumber
    },
    delivery: {
      estimated: formatDate(estimatedDelivery),
      hasEstimate: !!estimatedDelivery
    },
    order: {
      id: orderDetails?.externalId || printJobId,
      createdAt: formatDate(orderDetails?.createdAt),
      title: orderDetails?.lineItems?.[0]?.title || 'Custom Story Book',
      shippingAddress: orderDetails?.shippingAddress
    },
    lastUpdated: formatDate(lastUpdated)
  };
};

/**
 * Checks if order tracking data needs to be refreshed
 * @param {Object} orderData - Order tracking data
 * @param {number} maxAgeMinutes - Maximum age in minutes before refresh needed
 * @returns {boolean} - Whether refresh is needed
 */
export const needsRefresh = (orderData, maxAgeMinutes = 30) => {
  if (!orderData || !orderData.lastUpdated) return true;
  
  const lastUpdated = new Date(orderData.lastUpdated);
  const now = new Date();
  const ageMinutes = (now - lastUpdated) / (1000 * 60);
  
  return ageMinutes > maxAgeMinutes;
}; 