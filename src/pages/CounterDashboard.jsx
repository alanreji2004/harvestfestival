import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import CollectModal from '../components/CollectModal';
import RevokeModal from '../components/RevokeModal';
import { getActiveCounter, clearActiveCounter } from '../utils/counterSession';
import { subscribeToOrders, collectOrder, revokeOrderCollection } from '../firebase/orders';
import { formatCurrency, formatDate } from '../utils/validation';

const CounterDashboard = () => {
  const [activeCounter, setActiveCounterState] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Pending', 'Collected'

  // Modal states for collection
  const [targetOrder, setTargetOrder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toastMessage, setToastMessage] = useState({ type: '', text: '' });

  // Modal states for revoke
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState('');

  const navigate = useNavigate();

  // Load counter session on mount
  useEffect(() => {
    const current = getActiveCounter();
    if (!current) {
      navigate('/counter/login', { replace: true });
    } else {
      setActiveCounterState(current);
    }
  }, [navigate]);

  // Subscribe to realtime orders
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToOrders((fetchedOrders) => {
      if (isMounted) {
        setOrders(fetchedOrders);
        setLoading(false);
      }
    }, (error) => {
      if (isMounted) {
        setToastMessage({ type: 'error', text: 'Error connecting to realtime database.' });
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleChangeCounter = () => {
    clearActiveCounter();
    navigate('/counter/login');
  };

  // Filter & priority sort logic
  const q = searchQuery.toLowerCase().trim();

  const filteredOrders = orders
    .filter((order) => {
      // Status Filter
      if (statusFilter === 'Pending' && order.collectionStatus === 'collected') return false;
      if (statusFilter === 'Collected' && order.collectionStatus !== 'collected') return false;

      // Search Query Filter
      if (!q) return true;
      const tokenStr = String(order.tokenNumber || '');
      const nameStr = (order.name || '').toLowerCase();
      const phoneStr = order.phone || '';

      return tokenStr.includes(q) || nameStr.includes(q) || phoneStr.includes(q);
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

  // Calculate System-Wide Statistics
  const totalOrdersCount = orders.length;
  const collectedOrdersCount = orders.filter(o => o.collectionStatus === 'collected').length;
  const remainingOrdersCount = totalOrdersCount - collectedOrdersCount;
  const totalBiriyaniDistributed = orders
    .filter(o => o.collectionStatus === 'collected')
    .reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);

  // Calculate Counter-Specific Statistics for active counter
  const myCounterOrders = orders.filter(o => o.collectedByCounter === activeCounter);
  const myOrdersCollectedCount = myCounterOrders.length;
  const myBiriyaniDistributedCount = myCounterOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  const myGPayAmount = myCounterOrders
    .filter(o => o.paymentMode === 'gpay')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const myCashAmount = myCounterOrders
    .filter(o => o.paymentMode === 'cash')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Handle Marking as Collected via Modal
  const handleConfirmCollection = async (paymentMode) => {
    if (!targetOrder || !activeCounter) return;
    setIsProcessing(true);
    setModalError('');
    setToastMessage({ type: '', text: '' });

    try {
      await collectOrder(targetOrder.id, paymentMode, activeCounter);
      setToastMessage({
        type: 'success',
        text: `Token #${targetOrder.tokenNumber} (${targetOrder.name}) successfully marked as COLLECTED via ${paymentMode.toUpperCase()}!`
      });
      setTargetOrder(null);
    } catch (err) {
      setModalError(err.message || 'Failed to process collection.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Revoking Collection via Modal
  const handleConfirmRevoke = async () => {
    if (!revokeTarget || !activeCounter) return;
    setIsRevoking(true);
    setRevokeError('');
    setToastMessage({ type: '', text: '' });

    try {
      await revokeOrderCollection(revokeTarget.id, activeCounter);
      setToastMessage({
        type: 'success',
        text: `Collection for Token #${revokeTarget.tokenNumber} (${revokeTarget.name}) was successfully REVOKED. It is now returned to Not Collected.`
      });
      setRevokeTarget(null);
    } catch (err) {
      setRevokeError(err.message || 'Failed to revoke order collection.');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Header />

      <main className="main-content container-wide">
        {/* Header Bar */}
        <div className="counter-header-bar">
          <div>
            <span className="badge-counter-active">{activeCounter}</span>
            <h2 className="counter-main-title">BIRIYANI DISTRIBUTION</h2>
            <p className="counter-subtitle">Realtime Counter Management System</p>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleChangeCounter}
            >
              Switch Counter
            </button>
          </div>
        </div>

        {/* Global Toast Alert */}
        {toastMessage.text && (
          <div className={`alert ${toastMessage.type === 'error' ? 'alert-error' : 'alert-success'} mb-4`}>
            {toastMessage.text}
            <button className="alert-close" onClick={() => setToastMessage({ type: '', text: '' })}>&times;</button>
          </div>
        )}

        {/* System-Wide Statistics Grid */}
        <div className="counter-stats-section mb-4">
          <h3 className="section-small-title">EVENT SYSTEM OVERVIEW</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">TOTAL ORDERS</span>
              <span className="stat-value">{totalOrdersCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">COLLECTED</span>
              <span className="stat-value text-success-color">{collectedOrdersCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">REMAINING</span>
              <span className="stat-value text-warning-color">{remainingOrdersCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">BIRIYANI DISTRIBUTED</span>
              <span className="stat-value">{totalBiriyaniDistributed}</span>
            </div>
          </div>
        </div>

        {/* Counter-Specific Statistics Grid */}
        <div className="my-counter-stats-card mb-4">
          <h3 className="section-small-title">{activeCounter?.toUpperCase()} STATISTICS</h3>
          <div className="my-stats-grid">
            <div className="my-stat-item">
              <span className="my-stat-label">Orders Collected</span>
              <span className="my-stat-val">{myOrdersCollectedCount}</span>
            </div>
            <div className="my-stat-item">
              <span className="my-stat-label">Biriyani Distributed</span>
              <span className="my-stat-val">{myBiriyaniDistributedCount}</span>
            </div>
            <div className="my-stat-item">
              <span className="my-stat-label">GPay Total</span>
              <span className="my-stat-val">{formatCurrency(myGPayAmount)}</span>
            </div>
            <div className="my-stat-item">
              <span className="my-stat-label">Cash Total</span>
              <span className="my-stat-val">{formatCurrency(myCashAmount)}</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="counter-toolbar mb-4">
          <div className="search-box flex-1">
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search Token # / Name / Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>Clear</button>
            )}
          </div>

          <div className="status-filter-tabs">
            {['All', 'Pending', 'Collected'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Order Cards / Table Grid */}
        {loading ? (
          <Loading message="Loading realtime distribution queue..." />
        ) : filteredOrders.length === 0 ? (
          <div className="empty-table-card">
            <p>No orders found for the current search/filter criteria.</p>
          </div>
        ) : (
          <div className="counter-orders-grid">
            {filteredOrders.map((ord) => {
              const isCollected = ord.collectionStatus === 'collected';
              return (
                <div 
                  key={ord.id} 
                  className={`order-counter-card ${isCollected ? 'order-card-collected' : 'order-card-pending'}`}
                >
                  <div className="order-counter-card-header">
                    <span className="token-badge-lg">TOKEN #{ord.tokenNumber}</span>
                    <span className={`status-pill ${isCollected ? 'pill-success' : 'pill-pending'}`}>
                      {isCollected ? 'COLLECTED' : 'NOT COLLECTED'}
                    </span>
                  </div>

                  <div className="order-counter-card-body">
                    <div className="customer-info-line">
                      <span className="customer-name">{ord.name}</span>
                      <span className="customer-phone">{ord.phone}</span>
                    </div>

                    <div className="order-summary-pills">
                      <span className="qty-badge">{ord.quantity} Biriyani</span>
                      <span className="total-badge">{formatCurrency(ord.totalAmount)}</span>
                    </div>

                    {isCollected ? (
                      <div className="collected-audit-info">
                        <div>Payment: <strong>{ord.paymentMode === 'gpay' ? 'GPay' : 'Cash'}</strong></div>
                        <div>Collected by: <strong>{ord.collectedByCounter}</strong></div>
                        <div className="time-subtext">{formatDate(ord.collectedAt)}</div>
                      </div>
                    ) : (
                      <div className="uncollected-info">
                        <span>Payment Status: <strong>Pending</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="order-counter-card-footer">
                    {isCollected ? (
                      <div style={{ width: '100%' }}>
                        <button type="button" className="btn btn-secondary btn-block" disabled>
                          COLLECTED
                        </button>
                        {ord.collectedByCounter === activeCounter && (
                          <button 
                            type="button" 
                            className="btn-revoke-subtle"
                            onClick={() => {
                              setRevokeTarget(ord);
                              setRevokeError('');
                            }}
                          >
                            Revoke Collection
                          </button>
                        )}
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        className="btn btn-primary btn-block btn-lg"
                        onClick={() => {
                          setTargetOrder(ord);
                          setModalError('');
                        }}
                      >
                        COLLECT
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Collection Confirmation Modal */}
      <CollectModal
        isOpen={!!targetOrder}
        order={targetOrder}
        counterName={activeCounter}
        isLoading={isProcessing}
        error={modalError}
        onConfirm={handleConfirmCollection}
        onCancel={() => {
          setTargetOrder(null);
          setModalError('');
        }}
      />

      {/* Revoke Confirmation Modal */}
      <RevokeModal
        isOpen={!!revokeTarget}
        order={revokeTarget}
        isLoading={isRevoking}
        error={revokeError}
        onConfirm={handleConfirmRevoke}
        onCancel={() => {
          setRevokeTarget(null);
          setRevokeError('');
        }}
      />

      <Footer />
    </div>
  );
};

export default CounterDashboard;
