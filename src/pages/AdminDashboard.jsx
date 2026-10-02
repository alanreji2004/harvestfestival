import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import ConfirmModal from '../components/ConfirmModal';
import { subscribeToOrders, deleteOrder, resetOrderCounter, getOrderCounter } from '../firebase/orders';
import { formatCurrency, formatDate } from '../utils/validation';
import { exportOrdersToExcel } from '../utils/exportExcel';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [latestToken, setLatestToken] = useState(0);

  // Modal states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

        // Find highest token among orders or fetch counter
        if (fetchedOrders.length > 0) {
          const maxToken = Math.max(...fetchedOrders.map(o => o.tokenNumber || 0));
          setLatestToken(maxToken);
        } else {
          // If no orders, fetch counter directly
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

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const tokenStr = String(order.tokenNumber || '');
    const nameStr = (order.name || '').toLowerCase();
    const phoneStr = (order.phone || '');

    return tokenStr.includes(q) || nameStr.includes(q) || phoneStr.includes(q);
  });

  // Calculate stats
  const totalOrders = orders.length;
  const totalBiriyani = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

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

  // Handle Token Counter Reset
  const confirmResetCounter = async () => {
    setIsResetting(true);
    setActionError('');
    setActionSuccess('');

    try {
      await resetOrderCounter();
      setLatestToken(0);
      setActionSuccess('Order token counter has been reset to 0. The next order will receive Token #1.');
      setShowResetModal(false);
    } catch (err) {
      setActionError(err.message || 'Failed to reset token counter.');
    } finally {
      setIsResetting(false);
    }
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    try {
      exportOrdersToExcel(orders);
    } catch (err) {
      setActionError('Failed to export Excel file.');
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
              onClick={handleExportExcel}
              disabled={orders.length === 0}
            >
              Export Excel
            </button>
            <button 
              type="button" 
              className="btn btn-danger-outline" 
              onClick={() => setShowResetModal(true)}
            >
              Reset Token Counter
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

        {/* Summary Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">TOTAL ORDERS</span>
            <span className="stat-value">{totalOrders}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">TOTAL BIRIYANI</span>
            <span className="stat-value">{totalBiriyani}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">TOTAL AMOUNT</span>
            <span className="stat-value">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">LATEST TOKEN</span>
            <span className="stat-value">{latestToken}</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="table-controls">
          <div className="search-box">
            <label htmlFor="order-search" className="sr-only">Search Orders</label>
            <input
              type="text"
              id="order-search"
              className="form-input search-input"
              placeholder="Search orders by Name, Phone, or Token #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                Clear
              </button>
            )}
          </div>
          <div className="search-count">
            Showing {filteredOrders.length} of {totalOrders} orders
          </div>
        </div>

        {/* Realtime Orders Table */}
        {loadingOrders ? (
          <Loading message="Fetching realtime orders..." />
        ) : filteredOrders.length === 0 ? (
          <div className="empty-table-card">
            {searchQuery ? (
              <p>No orders match search query "<strong>{searchQuery}</strong>".</p>
            ) : (
              <p>No biriyani orders have been placed yet.</p>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Order Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <span className="token-pill">#{ord.tokenNumber}</span>
                    </td>
                    <td className="font-semibold">{ord.name}</td>
                    <td>{ord.phone}</td>
                    <td className="text-center font-semibold">{ord.quantity}</td>
                    <td>₹{ord.pricePerBiriyani || 180}</td>
                    <td className="font-semibold">{formatCurrency(ord.totalAmount)}</td>
                    <td className="text-sm color-muted">{formatDate(ord.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger-outline"
                        onClick={() => setDeleteTarget(ord)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Confirmation Modal for Reset Token Counter */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Reset Token Counter?"
        message="This will make the next order receive token number 1. This action should only be performed when starting a new ordering period/event."
        warningText="WARNING: Resetting the counter while existing orders are still active in the database can create duplicate token numbers for new customers."
        confirmText="Confirm Reset Counter"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isResetting}
        onConfirm={confirmResetCounter}
        onCancel={() => setShowResetModal(false)}
      />

      <Footer />
    </div>
  );
};

export default AdminDashboard;
