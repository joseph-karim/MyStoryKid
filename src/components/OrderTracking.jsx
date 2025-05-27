import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  getOrderTracking, 
  getAllOrdersWithTracking, 
  refreshOrderTracking,
  formatTrackingForUI,
  needsRefresh 
} from '../services/orderTrackingService';
import { useTable, useSortBy, useGlobalFilter, useFilters } from 'react-table';

/**
 * Component for displaying order tracking information
 */
const OrderTracking = ({ printJobId, showAllOrders = false, className = '' }) => {
  const [orders, setOrders] = useState([]);
  const [singleOrder, setSingleOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshingOrders, setRefreshingOrders] = useState(new Set());

  // Load order data on component mount
  useEffect(() => {
    const loadOrderData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (showAllOrders) {
          // Load all orders
          const result = await getAllOrdersWithTracking({ size: 10 });
          if (result.success) {
            setOrders(result.data.orders.map(formatTrackingForUI));
          } else {
            setError(result.error);
          }
        } else if (printJobId) {
          // Load single order
          const result = await getOrderTracking(printJobId);
          if (result.success) {
            setSingleOrder(formatTrackingForUI(result.data));
          } else {
            setError(result.error);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, [printJobId, showAllOrders]);

  // Handle refresh for a specific order
  const handleRefreshOrder = async (orderPrintJobId) => {
    setRefreshingOrders(prev => new Set([...prev, orderPrintJobId]));

    try {
      const result = await refreshOrderTracking(orderPrintJobId);
      if (result.success) {
        if (showAllOrders) {
          // Update the specific order in the list
          setOrders(prev => prev.map(order => 
            order.printJobId === orderPrintJobId 
              ? { ...order, lastUpdated: result.data.lastRefreshed }
              : order
          ));
        } else {
          // Reload single order data
          const orderResult = await getOrderTracking(orderPrintJobId);
          if (orderResult.success) {
            setSingleOrder(formatTrackingForUI(orderResult.data));
          }
        }
      }
    } catch (err) {
      console.error('Error refreshing order:', err);
    } finally {
      setRefreshingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderPrintJobId);
        return newSet;
      });
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading order tracking...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <span className="text-red-600 text-xl mr-3">⚠️</span>
          <div>
            <h3 className="text-red-800 font-semibold">Unable to load order tracking</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render single order tracking
  if (!showAllOrders && singleOrder) {
    return (
      <OrderTrackingCard 
        order={singleOrder}
        onRefresh={handleRefreshOrder}
        isRefreshing={refreshingOrders.has(singleOrder.printJobId)}
        className={className}
      />
    );
  }

  // Render all orders as a table with react-table
  if (showAllOrders) {
    if (orders.length === 0) {
      return (
        <div className={`p-8 text-center text-gray-500 ${className}`}>
          <span className="text-4xl mb-4 block">📦</span>
          <h3 className="text-lg font-semibold mb-2">No orders found</h3>
          <p>You haven't placed any print orders yet.</p>
        </div>
      );
    }

    // --- react-table setup ---
    const data = React.useMemo(() => orders, [orders]);
    const columns = React.useMemo(() => [
      {
        Header: 'Order ID',
        accessor: row => row.order.id,
        id: 'orderId',
      },
      {
        Header: 'Title',
        accessor: row => row.order.title,
        id: 'title',
      },
      {
        Header: 'Status',
        accessor: 'status',
        Filter: ({ column: { filterValue, setFilter } }) => (
          <select
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value || undefined)}
            className="border rounded px-2 py-1 text-xs"
          >
            <option value="">All</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        ),
        filter: 'includes',
      },
      {
        Header: 'Placed Date',
        accessor: row => row.order.createdAt,
        id: 'placedDate',
      },
      {
        Header: 'Delivery',
        accessor: 'delivery',
      },
      {
        Header: 'Tracking',
        accessor: 'tracking',
      },
      {
        Header: 'Last Updated',
        accessor: 'lastUpdated',
      },
      {
        Header: 'Actions',
        id: 'actions',
        Cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleRefreshOrder(row.original.printJobId)}
              disabled={refreshingOrders.has(row.original.printJobId)}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
              title="Refresh tracking"
            >
              🔄
            </button>
            <button
              onClick={() => window.alert(`View order ${row.original.order.id}`)}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="View order details"
            >
              👁️
            </button>
          </div>
        ),
      },
    ], [refreshingOrders]);

    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      rows,
      prepareRow,
      setGlobalFilter,
      state,
    } = useTable({ columns, data }, useFilters, useGlobalFilter, useSortBy);

    return (
      <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 overflow-x-auto ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Order Tracking</h2>
          <input
            type="text"
            placeholder="Search orders..."
            value={state.globalFilter || ''}
            onChange={e => setGlobalFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            aria-label="Search orders"
          />
        </div>
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  >
                    {column.render('Header')}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? ' 🔽'
                          : ' 🔼'
                        : ''}
                    </span>
                    {column.canFilter ? <div>{column.render('Filter')}</div> : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} className="px-4 py-2 whitespace-nowrap">
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};

/**
 * Individual order tracking card component
 */
const OrderTrackingCard = ({ order, onRefresh, isRefreshing, className = '' }) => {
  const {
    printJobId,
    status,
    tracking,
    delivery,
    order: orderInfo,
    lastUpdated
  } = order;

  const shouldRefresh = needsRefresh(order);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{orderInfo.title}</h3>
          <p className="text-sm text-gray-500">Order #{orderInfo.id}</p>
          {orderInfo.createdAt && (
            <p className="text-xs text-gray-400">Placed on {orderInfo.createdAt}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {shouldRefresh && (
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
              Data may be outdated
            </span>
          )}
          <button
            onClick={() => onRefresh(printJobId)}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
            title="Refresh tracking"
          >
            <span className={`text-sm ${isRefreshing ? 'animate-spin' : ''}`}>
              🔄
            </span>
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{status.icon}</span>
        <div>
          <p className={`font-semibold text-${status.color}-600`}>
            {status.message}
          </p>
          <p className="text-xs text-gray-500">
            Status: {status.code}
          </p>
        </div>
      </div>

      {/* Tracking Information */}
      {tracking.hasTracking && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">Tracking Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Tracking Number:</span>
              <p className="font-mono font-semibold">{tracking.number}</p>
            </div>
            {tracking.carrier && (
              <div>
                <span className="text-gray-600">Carrier:</span>
                <p className="font-semibold">{tracking.carrier}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Information */}
      {delivery.hasEstimate && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-800 mb-2">Delivery Information</h4>
          <div className="text-sm">
            <span className="text-blue-600">Estimated Delivery:</span>
            <p className="font-semibold text-blue-800">{delivery.estimated}</p>
          </div>
        </div>
      )}

      {/* Shipping Address */}
      {orderInfo.shippingAddress && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-800 mb-2">Shipping Address</h4>
          <div className="text-sm text-gray-600">
            <p>{orderInfo.shippingAddress.name}</p>
            <p>{orderInfo.shippingAddress.street1}</p>
            {orderInfo.shippingAddress.street2 && (
              <p>{orderInfo.shippingAddress.street2}</p>
            )}
            <p>
              {orderInfo.shippingAddress.city}, {orderInfo.shippingAddress.state_code} {orderInfo.shippingAddress.postcode}
            </p>
            <p>{orderInfo.shippingAddress.country_code}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-4 mt-4">
        <p className="text-xs text-gray-400">
          Last updated: {lastUpdated || 'Unknown'}
        </p>
      </div>
    </motion.div>
  );
};

export default OrderTracking; 