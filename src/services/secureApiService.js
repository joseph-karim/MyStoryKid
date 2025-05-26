/**
 * Secure API Service
 * 
 * This service provides secure access to external APIs (Shopify, Lulu Direct)
 * through Supabase Edge Function proxies. No API credentials are exposed to the frontend.
 */

import { supabase } from '../lib/supabase';

class SecureApiService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') + '/functions/v1';
  }

  /**
   * Get the current user's session token for authentication
   */
  async getAuthToken() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('User not authenticated. Please log in.');
    }
    
    return session.access_token;
  }

  /**
   * Make a secure call to Shopify API through proxy
   */
  async callShopifyAPI(endpoint, method = 'GET', body = null) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${this.baseUrl}/shopify-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ method, endpoint, body })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Shopify API call failed:', error);
      throw error;
    }
  }

  /**
   * Make a secure call to Lulu Direct API through proxy
   */
  async callLuluAPI(endpoint, method = 'GET', body = null) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${this.baseUrl}/lulu-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ method, endpoint, body })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Lulu API call failed:', error);
      throw error;
    }
  }

  // ===== SHOPIFY API METHODS =====

  /**
   * Get shop information
   */
  async getShopInfo() {
    return this.callShopifyAPI('/shop.json');
  }

  /**
   * Get orders
   */
  async getOrders(limit = 50, status = null) {
    let endpoint = `/orders.json?limit=${limit}`;
    if (status) {
      endpoint += `&status=${status}`;
    }
    return this.callShopifyAPI(endpoint);
  }

  /**
   * Get specific order
   */
  async getOrder(orderId) {
    return this.callShopifyAPI(`/orders/${orderId}.json`);
  }

  /**
   * Get products
   */
  async getProducts(limit = 50) {
    return this.callShopifyAPI(`/products.json?limit=${limit}`);
  }

  /**
   * Create a product
   */
  async createProduct(productData) {
    return this.callShopifyAPI('/products.json', 'POST', { product: productData });
  }

  /**
   * Update a product
   */
  async updateProduct(productId, productData) {
    return this.callShopifyAPI(`/products/${productId}.json`, 'PUT', { product: productData });
  }

  /**
   * Get webhooks
   */
  async getWebhooks() {
    return this.callShopifyAPI('/webhooks.json');
  }

  /**
   * Create webhook
   */
  async createWebhook(webhookData) {
    return this.callShopifyAPI('/webhooks.json', 'POST', { webhook: webhookData });
  }

  // ===== LULU DIRECT API METHODS =====

  /**
   * Get account information
   */
  async getLuluAccount() {
    return this.callLuluAPI('/account/');
  }

  /**
   * Get print job cost calculations
   */
  async getPrintJobCosts(costData) {
    return this.callLuluAPI('/print-job-cost-calculations/', 'POST', costData);
  }

  /**
   * Create a print job
   */
  async createPrintJob(printJobData) {
    return this.callLuluAPI('/print-jobs/', 'POST', printJobData);
  }

  /**
   * Get print job status
   */
  async getPrintJobStatus(printJobId) {
    return this.callLuluAPI(`/print-jobs/${printJobId}/`);
  }

  /**
   * Get Lulu webhooks
   */
  async getLuluWebhooks() {
    return this.callLuluAPI('/webhooks/');
  }

  /**
   * Create Lulu webhook
   */
  async createLuluWebhook(webhookData) {
    return this.callLuluAPI('/webhooks/', 'POST', webhookData);
  }

  // ===== CONVENIENCE METHODS =====

  /**
   * Create a complete print job for a MyStoryKid book
   */
  async createBookPrintJob(bookData) {
    const printJobData = {
      contact_email: bookData.customerEmail,
      external_id: bookData.orderId || `book-${bookData.id}`,
      line_items: [{
        external_id: `book-${bookData.id}`,
        printable_normalization: {
          pod_package_id: this.determinePODPackage(bookData),
          cover: {
            source_url: bookData.coverImageUrl
          },
          interior: {
            source_url: bookData.interiorPdfUrl
          }
        },
        quantity: bookData.quantity || 1
      }],
      shipping_address: bookData.shippingAddress
    };

    return this.createPrintJob(printJobData);
  }

  /**
   * Determine the appropriate POD package based on book specifications
   */
  determinePODPackage(bookData) {
    const pageCount = bookData.pageCount || 24;
    const hasColor = bookData.hasColorImages !== false; // Default to color
    
    if (pageCount <= 24) {
      return hasColor ? 'color-24-page-book' : 'bw-24-page-book';
    } else if (pageCount <= 48) {
      return hasColor ? 'color-48-page-book' : 'bw-48-page-book';
    } else {
      return hasColor ? 'color-standard-book' : 'bw-standard-book';
    }
  }

  /**
   * Get comprehensive order status including print job info
   */
  async getOrderWithPrintStatus(orderId) {
    try {
      // Get order from Shopify
      const shopifyOrder = await this.getOrder(orderId);
      
      // Try to get print job status from database
      const { data: printJobs } = await supabase
        .from('print_jobs')
        .select('*')
        .eq('order_id', orderId);

      return {
        shopifyOrder,
        printJobs: printJobs || []
      };
    } catch (error) {
      console.error('Error getting order with print status:', error);
      throw error;
    }
  }

  /**
   * Test the secure API connections
   */
  async testConnections() {
    const results = {
      shopify: { connected: false, error: null },
      lulu: { connected: false, error: null }
    };

    // Test Shopify connection
    try {
      await this.getShopInfo();
      results.shopify.connected = true;
    } catch (error) {
      results.shopify.error = error.message;
    }

    // Test Lulu Direct connection
    try {
      await this.getLuluAccount();
      results.lulu.connected = true;
    } catch (error) {
      results.lulu.error = error.message;
    }

    return results;
  }
}

// Export singleton instance
export const secureApiService = new SecureApiService();

// Export class for testing
export { SecureApiService }; 