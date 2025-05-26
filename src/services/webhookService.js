/**
 * Webhook Service
 * 
 * This service handles webhook registration and management for
 * Shopify and Lulu Direct integrations.
 */

import { supabase } from '../lib/supabase';

// Webhook endpoints
const WEBHOOK_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') + '/functions/v1';
const SHOPIFY_WEBHOOK_URL = `${WEBHOOK_BASE_URL}/webhook-handler/webhook/shopify`;
const LULU_WEBHOOK_URL = `${WEBHOOK_BASE_URL}/webhook-handler/webhook/lulu`;

// Shopify webhook topics we want to subscribe to
const SHOPIFY_WEBHOOK_TOPICS = [
  'orders/create',
  'orders/updated', 
  'orders/paid',
  'orders/cancelled',
  'orders/fulfilled'
];

/**
 * Register Shopify webhooks
 * @param {string} shopifyDomain - The Shopify store domain
 * @param {string} accessToken - Shopify access token
 * @returns {Promise<Object>} - Registration results
 */
export const registerShopifyWebhooks = async (shopifyDomain, accessToken) => {
  try {
    console.log('[webhookService] Registering Shopify webhooks...');
    
    const results = [];
    
    for (const topic of SHOPIFY_WEBHOOK_TOPICS) {
      try {
        const response = await fetch(`https://${shopifyDomain}/admin/api/2023-10/webhooks.json`, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            webhook: {
              topic: topic,
              address: SHOPIFY_WEBHOOK_URL,
              format: 'json'
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          results.push({
            topic,
            success: true,
            webhookId: data.webhook.id,
            address: data.webhook.address
          });
          console.log(`[webhookService] Registered webhook for ${topic}: ${data.webhook.id}`);
        } else {
          const error = await response.text();
          results.push({
            topic,
            success: false,
            error: `HTTP ${response.status}: ${error}`
          });
          console.error(`[webhookService] Failed to register webhook for ${topic}:`, error);
        }
      } catch (error) {
        results.push({
          topic,
          success: false,
          error: error.message
        });
        console.error(`[webhookService] Error registering webhook for ${topic}:`, error);
      }
    }

    // Store webhook configuration in database
    await storeWebhookConfig('shopify', {
      domain: shopifyDomain,
      webhooks: results,
      registered_at: new Date().toISOString()
    });

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      success: failed === 0,
      message: `Registered ${successful}/${SHOPIFY_WEBHOOK_TOPICS.length} Shopify webhooks`,
      results
    };
  } catch (error) {
    console.error('[webhookService] Error in registerShopifyWebhooks:', error);
    throw error;
  }
};

/**
 * Register Lulu Direct webhooks
 * @param {string} luluClientKey - Lulu Direct client key
 * @returns {Promise<Object>} - Registration results
 */
export const registerLuluWebhooks = async (luluClientKey) => {
  try {
    console.log('[webhookService] Registering Lulu Direct webhooks...');
    
    // Use the client key as the API key for webhook registration
    const response = await fetch('https://api.lulu.com/webhooks/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${luluClientKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: LULU_WEBHOOK_URL,
        events: ['print_job.status_changed'],
        active: true
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Store webhook configuration in database
      await storeWebhookConfig('lulu', {
        webhook_id: data.id,
        url: data.url,
        events: data.events,
        registered_at: new Date().toISOString()
      });

      console.log(`[webhookService] Registered Lulu webhook: ${data.id}`);
      
      return {
        success: true,
        message: 'Lulu Direct webhook registered successfully',
        webhookId: data.id,
        url: data.url
      };
    } else {
      const error = await response.text();
      console.error('[webhookService] Failed to register Lulu webhook:', error);
      
      return {
        success: false,
        message: `Failed to register Lulu webhook: HTTP ${response.status}`,
        error
      };
    }
  } catch (error) {
    console.error('[webhookService] Error in registerLuluWebhooks:', error);
    throw error;
  }
};

/**
 * Get webhook status and configuration
 * @returns {Promise<Object>} - Webhook status information
 */
export const getWebhookStatus = async () => {
  try {
    const { data: webhookConfigs, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[webhookService] Error fetching webhook configs:', error);
      throw error;
    }

    // Get recent webhook logs
    const { data: recentLogs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsError) {
      console.error('[webhookService] Error fetching webhook logs:', logsError);
    }

    // Analyze webhook health
    const shopifyConfig = webhookConfigs.find(c => c.service === 'shopify');
    const luluConfig = webhookConfigs.find(c => c.service === 'lulu');
    
    const shopifyLogs = recentLogs?.filter(l => l.source === 'shopify') || [];
    const luluLogs = recentLogs?.filter(l => l.source === 'lulu') || [];

    const shopifyHealth = analyzeWebhookHealth(shopifyLogs);
    const luluHealth = analyzeWebhookHealth(luluLogs);

    return {
      shopify: {
        configured: !!shopifyConfig,
        config: shopifyConfig,
        health: shopifyHealth,
        recentLogs: shopifyLogs.slice(0, 10)
      },
      lulu: {
        configured: !!luluConfig,
        config: luluConfig,
        health: luluHealth,
        recentLogs: luluLogs.slice(0, 10)
      },
      overall: {
        healthy: shopifyHealth.healthy && luluHealth.healthy,
        lastActivity: Math.max(
          shopifyHealth.lastActivity || 0,
          luluHealth.lastActivity || 0
        )
      }
    };
  } catch (error) {
    console.error('[webhookService] Error in getWebhookStatus:', error);
    throw error;
  }
};

/**
 * Test webhook endpoints
 * @returns {Promise<Object>} - Test results
 */
export const testWebhookEndpoints = async () => {
  try {
    console.log('[webhookService] Testing webhook endpoints...');
    
    const results = {};

    // Test Shopify webhook endpoint
    try {
      const shopifyResponse = await fetch(`${SHOPIFY_WEBHOOK_URL.replace('/webhook/shopify', '/health')}`, {
        method: 'GET'
      });
      
      results.shopify = {
        success: shopifyResponse.ok,
        status: shopifyResponse.status,
        message: shopifyResponse.ok ? 'Endpoint healthy' : 'Endpoint unhealthy'
      };
    } catch (error) {
      results.shopify = {
        success: false,
        status: 0,
        message: `Connection failed: ${error.message}`
      };
    }

    // Test Lulu webhook endpoint
    try {
      const luluResponse = await fetch(`${LULU_WEBHOOK_URL.replace('/webhook/lulu', '/health')}`, {
        method: 'GET'
      });
      
      results.lulu = {
        success: luluResponse.ok,
        status: luluResponse.status,
        message: luluResponse.ok ? 'Endpoint healthy' : 'Endpoint unhealthy'
      };
    } catch (error) {
      results.lulu = {
        success: false,
        status: 0,
        message: `Connection failed: ${error.message}`
      };
    }

    return {
      success: results.shopify.success && results.lulu.success,
      results
    };
  } catch (error) {
    console.error('[webhookService] Error in testWebhookEndpoints:', error);
    throw error;
  }
};

/**
 * Unregister webhooks
 * @param {string} service - Service name ('shopify' or 'lulu')
 * @param {Object} credentials - Service credentials
 * @returns {Promise<Object>} - Unregistration results
 */
export const unregisterWebhooks = async (service, credentials) => {
  try {
    console.log(`[webhookService] Unregistering ${service} webhooks...`);
    
    // Get current webhook configuration
    const { data: config, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('service', service)
      .single();

    if (error || !config) {
      return {
        success: false,
        message: `No webhook configuration found for ${service}`
      };
    }

    if (service === 'shopify') {
      return await unregisterShopifyWebhooks(config, credentials);
    } else if (service === 'lulu') {
      return await unregisterLuluWebhooks(config, credentials);
    } else {
      throw new Error(`Unsupported service: ${service}`);
    }
  } catch (error) {
    console.error(`[webhookService] Error unregistering ${service} webhooks:`, error);
    throw error;
  }
};

// Helper functions

/**
 * Store webhook configuration in database
 */
async function storeWebhookConfig(service, config) {
  const { error } = await supabase
    .from('webhook_configs')
    .upsert({
      service,
      config,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'service'
    });

  if (error) {
    console.error('[webhookService] Error storing webhook config:', error);
    throw error;
  }
}

/**
 * Analyze webhook health from logs
 */
function analyzeWebhookHealth(logs) {
  if (!logs || logs.length === 0) {
    return {
      healthy: false,
      lastActivity: null,
      successRate: 0,
      errorCount: 0,
      message: 'No recent activity'
    };
  }

  const recentLogs = logs.filter(log => {
    const logTime = new Date(log.created_at).getTime();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return logTime > oneDayAgo;
  });

  const successCount = recentLogs.filter(log => log.status === 'success').length;
  const errorCount = recentLogs.filter(log => log.status === 'error').length;
  const totalCount = recentLogs.length;
  
  const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
  const lastActivity = logs.length > 0 ? new Date(logs[0].created_at).getTime() : null;
  
  const healthy = successRate >= 95 && errorCount < 5;

  return {
    healthy,
    lastActivity,
    successRate: Math.round(successRate),
    errorCount,
    totalCount,
    message: healthy ? 'Healthy' : 'Issues detected'
  };
}

/**
 * Unregister Shopify webhooks
 */
async function unregisterShopifyWebhooks(config, credentials) {
  const { domain, accessToken } = credentials;
  const webhooks = config.config.webhooks || [];
  
  const results = [];
  
  for (const webhook of webhooks) {
    if (!webhook.success || !webhook.webhookId) continue;
    
    try {
      const response = await fetch(`https://${domain}/admin/api/2023-10/webhooks/${webhook.webhookId}.json`, {
        method: 'DELETE',
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      });

      results.push({
        topic: webhook.topic,
        webhookId: webhook.webhookId,
        success: response.ok,
        message: response.ok ? 'Unregistered' : `Failed: HTTP ${response.status}`
      });
    } catch (error) {
      results.push({
        topic: webhook.topic,
        webhookId: webhook.webhookId,
        success: false,
        message: `Error: ${error.message}`
      });
    }
  }

  // Remove configuration from database
  await supabase
    .from('webhook_configs')
    .delete()
    .eq('service', 'shopify');

  const successful = results.filter(r => r.success).length;
  
  return {
    success: successful === results.length,
    message: `Unregistered ${successful}/${results.length} Shopify webhooks`,
    results
  };
}

/**
 * Unregister Lulu webhooks
 */
async function unregisterLuluWebhooks(config, credentials) {
  const { apiKey } = credentials;
  const webhookId = config.config.webhook_id;
  
  if (!webhookId) {
    return {
      success: false,
      message: 'No webhook ID found in configuration'
    };
  }

  try {
    const response = await fetch(`https://api.lulu.com/webhooks/${webhookId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      // Remove configuration from database
      await supabase
        .from('webhook_configs')
        .delete()
        .eq('service', 'lulu');

      return {
        success: true,
        message: 'Lulu webhook unregistered successfully'
      };
    } else {
      return {
        success: false,
        message: `Failed to unregister Lulu webhook: HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error unregistering Lulu webhook: ${error.message}`
    };
  }
}

/**
 * Get webhook logs with filtering
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} - Filtered webhook logs
 */
export const getWebhookLogs = async (filters = {}) => {
  try {
    let query = supabase
      .from('webhook_logs')
      .select('*');

    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(filters.limit || 100);

    if (error) {
      console.error('[webhookService] Error fetching webhook logs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[webhookService] Error in getWebhookLogs:', error);
    throw error;
  }
}; 