import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import ConfirmModal from '../components/ConfirmModal';
import RevokeModal from '../components/RevokeModal';
import OrderTagGeneratorModal from '../components/OrderTagGeneratorModal';
import { subscribeToOrders, deleteOrder, getOrderCounter, revokeOrderCollection } from '../firebase/orders';
import { formatCurrency, formatDate } from '../utils/validation';
import { exportOrdersToExcel } from '../utils/exportExcel';
import { VALID_COUNTERS } from '../utils/counterSession';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [latestToken, setLatestToken] = useState(0);

  // Admin Table Filters
  const [filterCollectionStatus, setFilterCollectionStatus] = useState('All'); // 'All', 'Pending', 'Collected'
  const [filterPaymentMode, setFilterPaymentMode] = useState('All'); // 'All', 'gpay', 'cash', 'uncollected'
  const [filterCounter, setFilterCounter] = useState('All'); // 'All', 'Counter 1', 'Counter 2', ...

  // Modal states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const [isOrderTagsModalOpen, setIsOrderTagsModalOpen] = useState(false);

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  // Realtime Listener
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToOrders((fetchedOrders) => {
      if (isMounted) {
        setOrders(fetchedOrders);
        setLoadingOrders(false);

        if (fetchedOrders.length > 0) {
          const maxToken = Math.max(...fetchedOrders.map(o => o.tokenNumber || 0));
          setLatestToken(maxToken);
        } else {
          getOrderCounter().then(val => {
            if (isMounted) setLatestToken(val);
          });
        }
      }
    }, (error) => {
      if (isMounted) {
        setActionError('Failed to load realtime orders. Check connection/permissions.');
        setLoadingOrders(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      setActionError('Failed to log out.');
    }
  };

  // Multi-Filter Application & Priority Sorting
  const q = searchQuery.toLowerCase().trim();

  const filteredOrders = orders
    .filter((order) => {
      // 1. Search Query
      if (q) {
        const tokenStr = String(order.tokenNumber || '');
        const nameStr = (order.name || '').toLowerCase();
        const phoneStr = order.phone || '';
        const matchesSearch = tokenStr.includes(q) || nameStr.includes(q) || phoneStr.includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Collection Status Filter
      if (filterCollectionStatus === 'Pending' && order.collectionStatus === 'collected') return false;
      if (filterCollectionStatus === 'Collected' && order.collectionStatus !== 'collected') return false;

      // 3. Payment Mode Filter
      if (filterPaymentMode === 'gpay' && order.paymentMode !== 'gpay') return false;
      if (filterPaymentMode === 'cash' && order.paymentMode !== 'cash') return false;
      if (filterPaymentMode === 'uncollected' && order.collectionStatus === 'collected') return false;

      // 4. Counter Filter
      if (filterCounter !== 'All' && order.collectedByCounter !== filterCounter) return false;

      return true;
    })
    .sort((a, b) => {
      if (!q) {
        return (a.tokenNumber || 0) - (b.tokenNumber || 0);
      }

      const getMatchScore = (order) => {
        const tokenStr = String(order.tokenNumber || '');
        const nameStr = (order.name || '').toLowerCase();
        const phoneStr = order.phone || '';

        if (tokenStr === q) return 1; // Exact token match (e.g. #1 when typing 1)
        if (tokenStr.startsWith(q)) return 2; // Token starts with query (e.g. #10, #11 when typing 1)
        if (tokenStr.includes(q)) return 3; // Token contains query (e.g. #21, #31 when typing 1)
        if (nameStr.includes(q) || phoneStr.includes(q)) return 4; // Name or phone match
        return 5;
      };

      const scoreA = getMatchScore(a);
      const scoreB = getMatchScore(b);

      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }

      return (a.tokenNumber || 0) - (b.tokenNumber || 0);
    });

  // Calculate High-Level Collection Overview Statistics
  const totalOrdersCount = orders.length;
  const totalBiriyaniCount = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  
  const collectedOrdersList = orders.filter(o => o.collectionStatus === 'collected');
  const collectedOrdersCount = collectedOrdersList.length;
  const remainingOrdersCount = totalOrdersCount - collectedOrdersCount;

  const collectedBiriyaniCount = collectedOrdersList.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  const remainingBiriyaniCount = totalBiriyaniCount - collectedBiriyaniCount;

  // Payment Breakdown Statistics (Only collected orders count as received money)
  const gpayOrders = collectedOrdersList.filter(o => o.paymentMode === 'gpay');
  const gpayCount = gpayOrders.length;
  const gpayTotalAmount = gpayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const cashOrders = collectedOrdersList.filter(o => o.paymentMode === 'cash');
  const cashCount = cashOrders.length;
  const cashTotalAmount = cashOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const totalCollectedAmount = gpayTotalAmount + cashTotalAmount;

  // Counter-Wise Breakdown Calculation
  const counterSummaries = VALID_COUNTERS.map((counterName) => {
    const counterOrders = collectedOrdersList.filter(o => o.collectedByCounter === counterName);
    const ordersCount = counterOrders.length;
    const biriyaniCount = counterOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
    const gpayAmt = counterOrders.filter(o => o.paymentMode === 'gpay').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const cashAmt = counterOrders.filter(o => o.paymentMode === 'cash').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    return {
      counterName,
      ordersCount,
      biriyaniCount,
      gpayAmt,
      cashAmt,
      totalAmt: gpayAmt + cashAmt
    };
  });

  // Handle Revoking Order Collection
  const confirmRevokeOrder = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    setActionError('');
    setActionSuccess('');

    try {
      await revokeOrderCollection(revokeTarget.id, 'Admin');
      setActionSuccess(`Collection for Token #${revokeTarget.tokenNumber} (${revokeTarget.name}) was successfully REVOKED.`);
      setRevokeTarget(null);
    } catch (err) {
      setActionError(err.message || 'Failed to revoke collection.');
    } finally {
      setIsRevoking(false);
    }
  };

  // Handle Order Deletion
  const confirmDeleteOrder = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setActionError('');
    setActionSuccess('');

    try {
      await deleteOrder(deleteTarget.id);
      setActionSuccess(`Order #${deleteTarget.tokenNumber} for ${deleteTarget.name} was successfully deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      setActionError(err.message || 'Failed to delete order.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Excel Exports
  const handleExportAllExcel = () => {
    try {
      exportOrdersToExcel(orders, 'harvest-festival-2026-all-biriyani-orders.xlsx');
    } catch (err) {
      setActionError('Failed to export all orders to Excel.');
    }
  };

  const handleExportFilteredExcel = () => {
    try {
      exportOrdersToExcel(filteredOrders, 'harvest-festival-2026-filtered-biriyani-orders.xlsx');
    } catch (err) {
      setActionError('Failed to export filtered orders to Excel.');
    }
  };

  return (
    <div className="page-wrapper">
      <Header isAdminView={true} />

      <main className="main-content container-wide">
        {/* Admin Header Bar */}
        <div className="admin-header-bar">
          <div>
            <h2 className="admin-title">Admin Dashboard</h2>
            <p className="admin-subtitle">Logged in as: <strong>{currentUser?.email}</strong></p>
          </div>
          <div className="admin-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleExportAllExcel}
              disabled={orders.length === 0}
            >
              Export All Orders
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleExportFilteredExcel}
              disabled={filteredOrders.length === 0}
            >
              Export Current View
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsOrderTagsModalOpen(true)}
              disabled={orders.length === 0}
            >
              Download Order Tags
            </button>
            <button 
              type="button" 
              className="btn btn-danger-outline" 
              onClick={() => navigate('/admin/danger-zone')}
            >
              Danger Zone ⚠️
            </button>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Banners */}
        {actionError && (
          <div className="alert alert-error" role="alert">
            {actionError}
            <button className="alert-close" onClick={() => setActionError('')}>&times;</button>
          </div>
        )}
        {actionSuccess && (
          <div className="alert alert-success" role="alert">
            {actionSuccess}
            <button className="alert-close" onClick={() => setActionSuccess('')}>&times;</button>
          </div>
        )}

        {/* SECTION 1: COLLECTION OVERVIEW */}
        <div className="admin-dashboard-section mb-6">
          <h3 className="admin-section-heading">COLLECTION OVERVIEW</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">TOTAL ORDERS</span>
              <span className="stat-value">{totalOrdersCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">TOTAL BIRIYANI</span>
              <span className="stat-value">{totalBiriyaniCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">COLLECTED ORDERS</span>
              <span className="stat-value text-success-color">{collectedOrdersCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">REMAINING ORDERS</span>
              <span className="stat-value text-warning-color">{remainingOrdersCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">COLLECTED BIRIYANI</span>
              <span className="stat-value text-success-color">{collectedBiriyaniCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">REMAINING BIRIYANI</span>
              <span className="stat-value text-warning-color">{remainingBiriyaniCount}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: PAYMENT SUMMARY */}
        <div className="admin-dashboard-section mb-6">
          <h3 className="admin-section-heading">PAYMENT SUMMARY (COLLECTED REVENUE)</h3>
          <div className="stats-grid payment-summary-grid">
            <div className="stat-card payment-card">
              <span className="stat-label">GPAY REVENUE</span>
              <span className="stat-value">{formatCurrency(gpayTotalAmount)}</span>
              <span className="stat-subtext">{gpayCount} Orders collected via GPay</span>
            </div>
            <div className="stat-card payment-card">
              <span className="stat-label">CASH REVENUE</span>
              <span className="stat-value">{formatCurrency(cashTotalAmount)}</span>
              <span className="stat-subtext">{cashCount} Orders collected via Cash</span>
            </div>
            <div className="stat-card payment-card highlight-card">
              <span className="stat-label">TOTAL COLLECTED REVENUE</span>
              <span className="stat-value">{formatCurrency(totalCollectedAmount)}</span>
              <span className="stat-subtext">Total from {collectedOrdersCount} collected orders</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: COUNTER-WISE SUMMARY */}
        <div className="admin-dashboard-section mb-6">
          <h3 className="admin-section-heading">COUNTER-WISE PERFORMANCE</h3>
          <div className="counter-summary-grid">
            {counterSummaries.map((c) => (
              <div key={c.counterName} className="counter-breakdown-card">
                <div className="counter-card-header">
                  <span className="counter-name">{c.counterName}</span>
                  <span className="counter-total-price">{formatCurrency(c.totalAmt)}</span>
                </div>
                <div className="counter-card-body">
                  <div className="counter-stat-row">
                    <span>Orders Collected:</span>
                    <strong>{c.ordersCount}</strong>
                  </div>
                  <div className="counter-stat-row">
                    <span>Biriyani Distributed:</span>
                    <strong>{c.biriyaniCount}</strong>
                  </div>
                  <div className="counter-stat-row">
                    <span>GPay Revenue:</span>
                    <strong>{formatCurrency(c.gpayAmt)}</strong>
                  </div>
                  <div className="counter-stat-row">
                    <span>Cash Revenue:</span>
                    <strong>{formatCurrency(c.cashAmt)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: ORDERS TABLE WITH MULTI-FILTERS */}
        <div className="admin-dashboard-section">
          <div className="admin-section-header">
            <h3 className="admin-section-heading">ORDER MANAGEMENT TABLE</h3>
            <span className="search-count">
              Showing {filteredOrders.length} of {totalOrdersCount} orders
            </span>
          </div>

          {/* Filter Toolbar */}
          <div className="admin-filter-bar mb-4">
            <div className="search-box flex-1 min-w-200">
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search Token #, Name, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>Clear</button>
              )}
            </div>

            <div className="filter-group">
              <label htmlFor="filter-status" className="filter-label">Status:</label>
              <select
                id="filter-status"
                className="form-input filter-select"
                value={filterCollectionStatus}
                onChange={(e) => setFilterCollectionStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Collected">Collected</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-payment" className="filter-label">Payment:</label>
              <select
                id="filter-payment"
                className="form-input filter-select"
                value={filterPaymentMode}
                onChange={(e) => setFilterPaymentMode(e.target.value)}
              >
                <option value="All">All Payment</option>
                <option value="gpay">GPay</option>
                <option value="cash">Cash</option>
                <option value="uncollected">Not Collected</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-counter" className="filter-label">Counter:</label>
              <select
                id="filter-counter"
                className="form-input filter-select"
                value={filterCounter}
                onChange={(e) => setFilterCounter(e.target.value)}
              >
                <option value="All">All Counters</option>
                {VALID_COUNTERS.map((cnt) => (
                  <option key={cnt} value={cnt}>{cnt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Realtime Table */}
          {loadingOrders ? (
            <Loading message="Fetching realtime orders..." />
          ) : filteredOrders.length === 0 ? (
            <div className="empty-table-card">
              <p>No orders match the current search and filter selections.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Biriyani Count</th>
                    <th>Total Amount</th>
                    <th>Order Time</th>
                    <th>Collection Status</th>
                    <th>Payment Mode</th>
                    <th>Collected At</th>
                    <th>Collected By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((ord) => {
                    const isCollected = ord.collectionStatus === 'collected';
                    return (
                      <tr key={ord.id}>
                        <td>
                          <span className="token-pill">#{ord.tokenNumber}</span>
                        </td>
                        <td className="font-semibold">{ord.name}</td>
                        <td>{ord.phone}</td>
                        <td className="text-center font-semibold">{ord.quantity}</td>
                        <td className="font-semibold">{formatCurrency(ord.totalAmount)}</td>
                        <td className="text-sm color-muted">{formatDate(ord.createdAt)}</td>
                        <td>
                          <span className={`status-pill ${isCollected ? 'pill-success' : 'pill-pending'}`}>
                            {isCollected ? 'Collected' : 'Pending'}
                          </span>
                          {ord.collectionHistory?.some(h => h.action === 'revoked') && (
                            <div>
                              <span className="badge-subtle-warning">Previously Revoked</span>
                            </div>
                          )}
                        </td>
                        <td>
                          {isCollected ? (
                            <span className="payment-tag">
                              {ord.paymentMode === 'gpay' ? 'GPay' : 'Cash'}
                            </span>
                          ) : (
                            <span className="color-muted">-</span>
                          )}
                        </td>
                        <td className="text-sm color-muted">
                          {isCollected ? formatDate(ord.collectedAt) : '-'}
                        </td>
                        <td>
                          {isCollected ? (
                            <span className="counter-tag">{ord.collectedByCounter}</span>
                          ) : (
                            <span className="color-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {isCollected && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                style={{ color: '#c53030', borderColor: '#feb2b2', fontSize: '0.75rem', padding: '2px 8px' }}
                                onClick={() => setRevokeTarget(ord)}
                              >
                                Revoke
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-danger-outline"
                              style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                              onClick={() => setDeleteTarget(ord)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal for Order Deletion */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Order?"
        message={`Are you sure you want to delete the order for ${deleteTarget?.name} (Token #${deleteTarget?.tokenNumber})?`}
        warningText="This action will permanently delete this order document from Firestore. The deleted token number will NOT be reused for future orders."
        confirmText="Yes, Delete Order"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={confirmDeleteOrder}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Revoke Confirmation Modal */}
      <RevokeModal
        isOpen={!!revokeTarget}
        order={revokeTarget}
        isLoading={isRevoking}
        error={actionError}
        onConfirm={confirmRevokeOrder}
        onCancel={() => setRevokeTarget(null)}
      />

      {/* Order Tag Generator Modal */}
      <OrderTagGeneratorModal
        isOpen={isOrderTagsModalOpen}
        orders={orders}
        onClose={() => setIsOrderTagsModalOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default AdminDashboard;
