import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  getWebhookStatus,
  registerShopifyWebhooks,
  registerLuluWebhooks,
  testWebhookEndpoints,
  unregisterWebhooks,
  getWebhookLogs
} from '../services/webhookService.js';

const WebhookManager = () => {
  const [webhookStatus, setWebhookStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('status');
  const [logs, setLogs] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Registration form state
  const [shopifyConfig, setShopifyConfig] = useState({
    domain: '',
    accessToken: ''
  });
  const [luluConfig, setLuluConfig] = useState({
    apiKey: ''
  });

  useEffect(() => {
    loadWebhookStatus();
    loadWebhookLogs();
  }, []);

  const loadWebhookStatus = async () => {
    try {
      setIsLoading(true);
      const status = await getWebhookStatus();
      setWebhookStatus(status);
      setError(null);
    } catch (err) {
      console.error('Error loading webhook status:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWebhookLogs = async () => {
    try {
      const recentLogs = await getWebhookLogs({ limit: 50 });
      setLogs(recentLogs);
    } catch (err) {
      console.error('Error loading webhook logs:', err);
    }
  };

  const handleRegisterShopify = async () => {
    if (!shopifyConfig.domain || !shopifyConfig.accessToken) {
      setError('Please provide both Shopify domain and access token');
      return;
    }

    try {
      setIsRegistering(true);
      setError(null);
      
      const result = await registerShopifyWebhooks(
        shopifyConfig.domain,
        shopifyConfig.accessToken
      );

      if (result.success) {
        await loadWebhookStatus();
        setShopifyConfig({ domain: '', accessToken: '' });
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error registering Shopify webhooks:', err);
      setError(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegisterLulu = async () => {
    if (!luluConfig.apiKey) {
      setError('Please provide Lulu Direct API key');
      return;
    }

    try {
      setIsRegistering(true);
      setError(null);
      
      const result = await registerLuluWebhooks(luluConfig.apiKey);

      if (result.success) {
        await loadWebhookStatus();
        setLuluConfig({ apiKey: '' });
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error registering Lulu webhooks:', err);
      setError(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleTestEndpoints = async () => {
    try {
      setIsTesting(true);
      setError(null);
      
      const results = await testWebhookEndpoints();
      setTestResults(results);
    } catch (err) {
      console.error('Error testing webhook endpoints:', err);
      setError(err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleUnregister = async (service) => {
    if (!confirm(`Are you sure you want to unregister ${service} webhooks?`)) {
      return;
    }

    try {
      setIsRegistering(true);
      setError(null);

      let credentials = {};
      if (service === 'shopify') {
        const domain = prompt('Enter Shopify domain:');
        const accessToken = prompt('Enter Shopify access token:');
        if (!domain || !accessToken) return;
        credentials = { domain, accessToken };
      } else if (service === 'lulu') {
        const apiKey = prompt('Enter Lulu Direct API key:');
        if (!apiKey) return;
        credentials = { apiKey };
      }

      const result = await unregisterWebhooks(service, credentials);
      
      if (result.success) {
        await loadWebhookStatus();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error(`Error unregistering ${service} webhooks:`, err);
      setError(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getHealthBadge = (health) => {
    if (!health) return null;

    const { healthy, successRate, errorCount } = health;
    
    if (healthy) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Healthy ({successRate}%)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="w-4 h-4 mr-1" />
          Issues ({errorCount} errors)
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading webhook status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Webhook Management</h2>
          <p className="text-gray-600">Manage integrations with Shopify and Lulu Direct</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleTestEndpoints}
            disabled={isTesting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isTesting ? (
              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Cog6ToothIcon className="w-4 h-4 mr-2" />
            )}
            Test Endpoints
          </button>
          <button
            onClick={loadWebhookStatus}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 border border-gray-200 rounded-md p-4"
        >
          <h3 className="text-sm font-medium text-gray-900 mb-3">Endpoint Test Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Shopify Endpoint</span>
              {testResults.results.shopify.success ? (
                <span className="text-green-600 text-sm">✓ Healthy</span>
              ) : (
                <span className="text-red-600 text-sm">✗ {testResults.results.shopify.message}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lulu Endpoint</span>
              {testResults.results.lulu.success ? (
                <span className="text-green-600 text-sm">✓ Healthy</span>
              ) : (
                <span className="text-red-600 text-sm">✗ {testResults.results.lulu.message}</span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'status', name: 'Status', icon: ChartBarIcon },
            { id: 'configure', name: 'Configure', icon: Cog6ToothIcon },
            { id: 'logs', name: 'Logs', icon: ClockIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shopify Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Shopify Integration</h4>
                    {webhookStatus?.shopify?.configured ? (
                      <span className="text-green-600 text-sm">✓ Configured</span>
                    ) : (
                      <span className="text-red-600 text-sm">✗ Not Configured</span>
                    )}
                  </div>
                  {webhookStatus?.shopify?.health && (
                    <div className="space-y-2">
                      {getHealthBadge(webhookStatus.shopify.health)}
                      <div className="text-xs text-gray-500">
                        Last activity: {webhookStatus.shopify.health.lastActivity 
                          ? formatTimestamp(webhookStatus.shopify.health.lastActivity)
                          : 'Never'
                        }
                      </div>
                    </div>
                  )}
                  {webhookStatus?.shopify?.configured && (
                    <button
                      onClick={() => handleUnregister('shopify')}
                      disabled={isRegistering}
                      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Unregister
                    </button>
                  )}
                </div>

                {/* Lulu Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Lulu Direct Integration</h4>
                    {webhookStatus?.lulu?.configured ? (
                      <span className="text-green-600 text-sm">✓ Configured</span>
                    ) : (
                      <span className="text-red-600 text-sm">✗ Not Configured</span>
                    )}
                  </div>
                  {webhookStatus?.lulu?.health && (
                    <div className="space-y-2">
                      {getHealthBadge(webhookStatus.lulu.health)}
                      <div className="text-xs text-gray-500">
                        Last activity: {webhookStatus.lulu.health.lastActivity 
                          ? formatTimestamp(webhookStatus.lulu.health.lastActivity)
                          : 'Never'
                        }
                      </div>
                    </div>
                  )}
                  {webhookStatus?.lulu?.configured && (
                    <button
                      onClick={() => handleUnregister('lulu')}
                      disabled={isRegistering}
                      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Unregister
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      {log.status === 'success' ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {log.source} - {log.event_type}
                        </span>
                        {log.error_message && (
                          <p className="text-xs text-red-600">{log.error_message}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(log.created_at)}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'configure' && (
          <div className="space-y-6">
            {/* Shopify Configuration */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shopify Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Domain
                  </label>
                  <input
                    type="text"
                    value={shopifyConfig.domain}
                    onChange={(e) => setShopifyConfig(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="your-store.myshopify.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Token
                  </label>
                  <input
                    type="password"
                    value={shopifyConfig.accessToken}
                    onChange={(e) => setShopifyConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                    placeholder="shpat_..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleRegisterShopify}
                  disabled={isRegistering || !shopifyConfig.domain || !shopifyConfig.accessToken}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegistering ? 'Registering...' : 'Register Shopify Webhooks'}
                </button>
              </div>
            </div>

            {/* Lulu Configuration */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Lulu Direct Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={luluConfig.apiKey}
                    onChange={(e) => setLuluConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="lulu_api_key_..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleRegisterLulu}
                  disabled={isRegistering || !luluConfig.apiKey}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegistering ? 'Registering...' : 'Register Lulu Direct Webhooks'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Webhook Logs</h3>
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {log.status === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium text-gray-900">
                        {log.source} - {log.event_type}
                      </span>
                      <span className="text-sm text-gray-500">
                        {log.reference_id}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(log.created_at)}
                    </span>
                  </div>
                  {log.error_message && (
                    <p className="text-sm text-red-600 mt-2">{log.error_message}</p>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No webhook logs found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhookManager; 