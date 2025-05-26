/**
 * Secure API Tester Component
 * 
 * This component provides a testing interface for the secure API proxy functions
 * and displays connection status and usage statistics.
 */

import React, { useState, useEffect } from 'react';
import { secureApiService } from '../services/secureApiService';
import { supabase } from '../lib/supabase';

const SecureApiTester = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    shopify: 'untested',
    lulu: 'untested'
  });
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStats, setApiStats] = useState(null);

  // Quick connection test
  const testConnections = async () => {
    setIsLoading(true);
    const results = [];
    
    try {
      // Test Shopify connection
      setConnectionStatus(prev => ({ ...prev, shopify: 'testing' }));
      const shopResult = await secureApiService.getShopInfo();
      setConnectionStatus(prev => ({ ...prev, shopify: 'success' }));
      results.push({
        service: 'Shopify',
        test: 'Shop Info',
        status: 'success',
        data: shopResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, shopify: 'error' }));
      results.push({
        service: 'Shopify',
        test: 'Shop Info',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    try {
      // Test Lulu connection
      setConnectionStatus(prev => ({ ...prev, lulu: 'testing' }));
      const luluResult = await secureApiService.getLuluAccount();
      setConnectionStatus(prev => ({ ...prev, lulu: 'success' }));
      results.push({
        service: 'Lulu Direct',
        test: 'Account Info',
        status: 'success',
        data: luluResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, lulu: 'error' }));
      results.push({
        service: 'Lulu Direct',
        test: 'Account Info',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  // Load API usage statistics
  const loadApiStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_api_stats', { hours_back: 24 });
      if (error) throw error;
      setApiStats(data);
    } catch (error) {
      console.error('Error loading API stats:', error);
    }
  };

  useEffect(() => {
    loadApiStats();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'testing': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'testing': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Connection Test */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">🔗 Connection Status</h2>
          <button
            onClick={testConnections}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Connections'}
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border ${getStatusColor(connectionStatus.shopify)}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">Shopify API</span>
              <span className="text-2xl">{getStatusIcon(connectionStatus.shopify)}</span>
            </div>
            <p className="text-sm mt-1 capitalize">{connectionStatus.shopify}</p>
          </div>
          
          <div className={`p-4 rounded-lg border ${getStatusColor(connectionStatus.lulu)}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">Lulu Direct API</span>
              <span className="text-2xl">{getStatusIcon(connectionStatus.lulu)}</span>
            </div>
            <p className="text-sm mt-1 capitalize">{connectionStatus.lulu}</p>
          </div>
        </div>
      </div>

      {/* API Usage Statistics */}
      {apiStats && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">📊 API Usage (Last 24 Hours)</h3>
            <button
              onClick={loadApiStats}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Refresh
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {apiStats.map((stat) => (
              <div key={stat.service} className="border rounded-lg p-4">
                <h4 className="font-medium capitalize mb-2">{stat.service} API</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Calls:</span>
                    <span className="font-medium">{stat.total_calls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className={`font-medium ${stat.success_rate >= 95 ? 'text-green-600' : 
                                                   stat.success_rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {stat.success_rate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Response:</span>
                    <span className="font-medium">{stat.avg_response_time}ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🧪 Test Results</h3>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{result.service}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{result.test}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                
                {result.status === 'success' && result.data && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Response:</p>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
                
                {result.status === 'error' && (
                  <div className="mt-2">
                    <p className="text-sm text-red-600">Error: {result.error}</p>
                  </div>
                )}
                
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed API Testing */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🔧 Detailed API Testing</h3>
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Shopify Tests */}
          <div>
            <h4 className="font-medium mb-3 text-blue-600">Shopify API Tests</h4>
            <div className="space-y-2">
              <button 
                onClick={async () => {
                  try {
                    const result = await secureApiService.getOrders(10);
                    setTestResults(prev => [...prev, {
                      service: 'Shopify',
                      test: 'Get Orders',
                      status: 'success',
                      data: result,
                      timestamp: new Date().toISOString()
                    }]);
                  } catch (error) {
                    setTestResults(prev => [...prev, {
                      service: 'Shopify',
                      test: 'Get Orders',
                      status: 'error',
                      error: error.message,
                      timestamp: new Date().toISOString()
                    }]);
                  }
                }}
                className="w-full text-left p-2 border rounded hover:bg-gray-50"
              >
                Get Recent Orders
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const result = await secureApiService.getProducts(5);
                    setTestResults(prev => [...prev, {
                      service: 'Shopify',
                      test: 'Get Products',
                      status: 'success',
                      data: result,
                      timestamp: new Date().toISOString()
                    }]);
                  } catch (error) {
                    setTestResults(prev => [...prev, {
                      service: 'Shopify',
                      test: 'Get Products',
                      status: 'error',
                      error: error.message,
                      timestamp: new Date().toISOString()
                    }]);
                  }
                }}
                className="w-full text-left p-2 border rounded hover:bg-gray-50"
              >
                Get Products
              </button>
            </div>
          </div>

          {/* Lulu Direct Tests */}
          <div>
            <h4 className="font-medium mb-3 text-purple-600">Lulu Direct API Tests</h4>
            <div className="space-y-2">
              <button 
                onClick={async () => {
                  try {
                    const result = await secureApiService.getPrintJobCosts({
                      line_items: [{ pod_package_id: "0425X0687BWSTDPB060UW444GXX" }]
                    });
                    setTestResults(prev => [...prev, {
                      service: 'Lulu Direct',
                      test: 'Get Print Costs',
                      status: 'success',
                      data: result,
                      timestamp: new Date().toISOString()
                    }]);
                  } catch (error) {
                    setTestResults(prev => [...prev, {
                      service: 'Lulu Direct',
                      test: 'Get Print Costs',
                      status: 'error',
                      error: error.message,
                      timestamp: new Date().toISOString()
                    }]);
                  }
                }}
                className="w-full text-left p-2 border rounded hover:bg-gray-50"
              >
                Get Print Costs
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const result = await secureApiService.getPrintJobs();
                    setTestResults(prev => [...prev, {
                      service: 'Lulu Direct',
                      test: 'Get Print Jobs',
                      status: 'success',
                      data: result,
                      timestamp: new Date().toISOString()
                    }]);
                  } catch (error) {
                    setTestResults(prev => [...prev, {
                      service: 'Lulu Direct',
                      test: 'Get Print Jobs',
                      status: 'error',
                      error: error.message,
                      timestamp: new Date().toISOString()
                    }]);
                  }
                }}
                className="w-full text-left p-2 border rounded hover:bg-gray-50"
              >
                Get Print Jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureApiTester; 