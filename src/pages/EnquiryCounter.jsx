import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import { subscribeToOrders } from '../firebase/orders';
import { formatCurrency, formatDate } from '../utils/validation';
import '../styles/enquiry.css';

const EnquiryCounter = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Orders data state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Search input & committed search state
  const [inputValue, setInputValue] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Pending', 'Collected'
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  // Subscribe to realtime orders from Firebase
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToOrders(
      (fetchedOrders) => {
        if (isMounted) {
          setOrders(fetchedOrders);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Realtime Firestore Listener Error:', error);
        if (isMounted) {
          setErrorMessage('Unable to connect to orders database. Please check your internet connection.');
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Autofocus search on desktop mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: ESC to clear
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle phone copy
  const handleCopyPhone = (phone, orderId) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedOrderId(orderId);
    setTimeout(() => {
      setCopiedOrderId(null);
    }, 2000);
  };

  // Helper matching logic
  const checkOrderMatch = (order, query) => {
    if (!query) return true;
    const cleanQ = query.trim().toLowerCase();
    const cleanTokenQ = cleanQ.replace(/^#/, '').trim();
    const cleanPhoneQ = cleanQ.replace(/\D/g, '');

    const tokenStr = String(order.tokenNumber || '');
    const nameStr = (order.name || '').toLowerCase();
    const phoneStr = order.phone || '';
    const phoneClean = phoneStr.replace(/\D/g, '');

    // Token match
    if (cleanTokenQ && (tokenStr === cleanTokenQ || tokenStr.includes(cleanTokenQ))) {
      return true;
    }

    // Name match
    if (nameStr.includes(cleanQ)) {
      return true;
    }

    // Phone match
    if (phoneStr.includes(cleanQ) || (cleanPhoneQ && phoneClean.includes(cleanPhoneQ))) {
      return true;
    }

    return false;
  };

  // Live suggestions based on current typing input
  const suggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return [];

    const cleanTokenQ = q.replace(/^#/, '').trim();

    return orders
      .filter((order) => checkOrderMatch(order, q))
      .sort((a, b) => {
        const tokenStrA = String(a.tokenNumber || '');
        const tokenStrB = String(b.tokenNumber || '');

        if (cleanTokenQ && tokenStrA === cleanTokenQ) return -1;
        if (cleanTokenQ && tokenStrB === cleanTokenQ) return 1;
        if (cleanTokenQ && tokenStrA.startsWith(cleanTokenQ)) return -1;
        if (cleanTokenQ && tokenStrB.startsWith(cleanTokenQ)) return 1;

        return (a.tokenNumber || 0) - (b.tokenNumber || 0);
      })
      .slice(0, 5);
  }, [orders, inputValue]);

  // Execute committed search
  const handleExecuteSearch = (e) => {
    if (e) e.preventDefault();
    setCommittedQuery(inputValue.trim());
    setShowSuggestions(false);
  };

  // When a suggestion is clicked: show ONLY that searched order in the list!
  const handleSelectSuggestion = (order) => {
    const tokenStr = `#${order.tokenNumber}`;
    setInputValue(tokenStr);
    setCommittedQuery(tokenStr);
    setShowSuggestions(false);
  };

  // Clear search and reset list
  const handleClearSearch = () => {
    setInputValue('');
    setCommittedQuery('');
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Filtered orders to display in the list
  const displayedOrders = useMemo(() => {
    const activeSearch = committedQuery || inputValue.trim();

    return orders
      .filter((order) => {
        // Status Filter
        if (statusFilter === 'Pending' && order.collectionStatus === 'collected') return false;
        if (statusFilter === 'Collected' && order.collectionStatus !== 'collected') return false;

        // Search Filter: if searched, show ONLY matching orders
        if (activeSearch) {
          return checkOrderMatch(order, activeSearch);
        }

        return true;
      })
      .sort((a, b) => {
        const activeSearch = committedQuery || inputValue.trim();
        if (!activeSearch) {
          return (a.tokenNumber || 0) - (b.tokenNumber || 0);
        }

        const cleanTokenQ = activeSearch.replace(/^#/, '').trim().toLowerCase();
        const cleanQ = activeSearch.trim().toLowerCase();

        const getMatchScore = (order) => {
          const tokenStr = String(order.tokenNumber || '');
          const nameStr = (order.name || '').toLowerCase();
          const phoneStr = order.phone || '';

          if (cleanTokenQ && tokenStr === cleanTokenQ) return 1;
          if (cleanTokenQ && tokenStr.startsWith(cleanTokenQ)) return 2;
          if (nameStr.startsWith(cleanQ)) return 3;
          if (nameStr.includes(cleanQ)) return 4;
          if (phoneStr.includes(cleanQ)) return 5;
          return 6;
        };

        const scoreA = getMatchScore(a);
        const scoreB = getMatchScore(b);

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        return (a.tokenNumber || 0) - (b.tokenNumber || 0);
      });
  }, [orders, statusFilter, committedQuery, inputValue]);

  // Overall statistics
  const totalOrdersCount = orders.length;
  const totalBiriyaniCount = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  const collectedOrdersCount = orders.filter((o) => o.collectionStatus === 'collected').length;
  const pendingOrdersCount = totalOrdersCount - collectedOrdersCount;

  const currentSearchTerm = committedQuery || inputValue.trim();

  return (
    <div className="page-wrapper">
      <Header />

      <main className="main-content container-wide">
        {/* Header Bar */}
        <div className="enquiry-header-bar">
          <div className="enquiry-title-group">
            <h1>Enquiry Counter</h1>
            <p>Biriyani order directory and token lookup</p>
          </div>

          <div className="enquiry-nav-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/')}
            >
              &larr; Booking Status
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/counter/login')}
            >
              Counter Portal
            </button>
          </div>
        </div>

        {/* Global Statistics Overview */}
        <div className="enquiry-summary-grid">
          <div className="enquiry-summary-item">
            <div className="enquiry-summary-label">Total Orders</div>
            <div className="enquiry-summary-value">{totalOrdersCount}</div>
          </div>
          <div className="enquiry-summary-item">
            <div className="enquiry-summary-label">Total Biriyani</div>
            <div className="enquiry-summary-value">{totalBiriyaniCount}</div>
          </div>
          <div className="enquiry-summary-item">
            <div className="enquiry-summary-label">Collected</div>
            <div className="enquiry-summary-value">{collectedOrdersCount}</div>
          </div>
          <div className="enquiry-summary-item">
            <div className="enquiry-summary-label">Pending</div>
            <div className="enquiry-summary-value">{pendingOrdersCount}</div>
          </div>
        </div>

        {/* Major Search Input Box */}
        <div className="enquiry-search-box-card">
          <label htmlFor="enquiry-search-input" className="enquiry-search-label">
            Search Order by Token Number, Customer Name, or Phone Number
          </label>

          <form onSubmit={handleExecuteSearch} className="enquiry-search-form-row">
            <div className="enquiry-input-wrapper">
              <input
                ref={searchInputRef}
                id="enquiry-search-input"
                type="text"
                className="enquiry-major-input"
                placeholder="Enter Token # (e.g. 15), Customer Name, or Mobile Number..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (inputValue.trim()) setShowSuggestions(true);
                }}
                autoComplete="off"
                spellCheck="false"
              />

              {inputValue && (
                <button
                  type="button"
                  className="input-clear-icon-btn"
                  onClick={handleClearSearch}
                  title="Clear input"
                >
                  &times;
                </button>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary enquiry-search-submit-btn"
            >
              Search
            </button>
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && inputValue.trim() && (
            <div ref={dropdownRef} className="enquiry-suggestions-panel">
              <div className="enquiry-suggestions-header">
                <span>Matching Suggestions</span>
                <span>Click to view order</span>
              </div>

              {suggestions.length > 0 ? (
                suggestions.map((sug) => {
                  const isCollected = sug.collectionStatus === 'collected';
                  return (
                    <div
                      key={sug.id || sug.tokenNumber}
                      className="enquiry-suggestion-row"
                      onMouseDown={() => handleSelectSuggestion(sug)}
                    >
                      <div className="suggestion-left-info">
                        <span className="suggestion-token-pill">#{sug.tokenNumber}</span>
                        <div className="suggestion-customer-text">
                          <span className="suggestion-customer-name">{sug.name}</span>
                          <span className="suggestion-customer-phone">{sug.phone}</span>
                        </div>
                      </div>

                      <div className="suggestion-right-info">
                        <span className="suggestion-quantity">{sug.quantity} Biriyani</span>
                        <span className={`suggestion-status ${isCollected ? 'status-collected' : 'status-pending'}`}>
                          {isCollected ? 'Collected' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="suggestion-no-results">
                  No suggestions found for "{inputValue}". Press Search or check the query.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toolbar: Status Tabs & Results Count */}
        <div className="enquiry-toolbar-row">
          <div className="enquiry-filter-buttons">
            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              All Orders ({totalOrdersCount})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === 'Pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Pending')}
            >
              Pending ({pendingOrdersCount})
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === 'Collected' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Collected')}
            >
              Collected ({collectedOrdersCount})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {currentSearchTerm && (
              <span className="enquiry-search-tag-indicator">
                Searched: "{currentSearchTerm}"
                <button
                  type="button"
                  className="tag-remove-btn"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  &times;
                </button>
              </span>
            )}

            <span className="enquiry-count-info">
              Showing {displayedOrders.length} {displayedOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="alert alert-error mb-4" role="alert">
            {errorMessage}
          </div>
        )}

        {/* =========================================================================
            STATIC ORDER LIST (READ-ONLY: NO EDIT OR DELETE)
            ========================================================================= */}
        {loading ? (
          <Loading message="Loading orders directory..." />
        ) : displayedOrders.length === 0 ? (
          /* Empty Search Results */
          <div className="enquiry-no-results-box">
            <h3 className="enquiry-no-results-title">No results found</h3>
            <p className="enquiry-no-results-text">
              {currentSearchTerm
                ? `No orders match your search for "${currentSearchTerm}".`
                : 'No orders available in this view.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleClearSearch}
            >
              Show All Orders
            </button>
          </div>
        ) : (
          /* Static Orders List */
          <div className="enquiry-orders-list">
            {displayedOrders.map((ord) => {
              const isCollected = ord.collectionStatus === 'collected';
              const orderId = ord.id || String(ord.tokenNumber);

              return (
                <div key={orderId} className="enquiry-list-item">
                  {/* Token Number */}
                  <div className="list-col-token">
                    <span className="list-token-badge">#{ord.tokenNumber}</span>
                  </div>

                  {/* Customer Name */}
                  <div className="list-col-name">
                    <span className="list-customer-name">{ord.name}</span>
                    <span className="list-customer-subtext">
                      Booked: {formatDate(ord.createdAt)}
                    </span>
                  </div>

                  {/* Phone Number */}
                  <div className="list-col-phone">
                    <span className="list-phone-text">{ord.phone}</span>
                    <button
                      type="button"
                      className="list-copy-btn"
                      onClick={() => handleCopyPhone(ord.phone, orderId)}
                      title="Copy phone"
                    >
                      {copiedOrderId === orderId ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Quantity */}
                  <div className="list-col-quantity">
                    <span className="list-qty-badge">{ord.quantity} Biriyani</span>
                    <span className="list-qty-subtext">₹180 / packet</span>
                  </div>

                  {/* Total Amount */}
                  <div className="list-col-amount">
                    {formatCurrency(ord.totalAmount || (ord.quantity * 180))}
                  </div>

                  {/* Collection Status */}
                  <div className="list-col-status">
                    <span className={`list-status-badge ${isCollected ? 'status-collected' : 'status-pending'}`}>
                      {isCollected ? 'Collected' : 'Pending'}
                    </span>
                    {isCollected && (
                      <span className="list-collection-details">
                        {ord.collectedByCounter || 'Counter'} &bull; {ord.paymentMode ? ord.paymentMode.toUpperCase() : ''}
                      </span>
                    )}
                  </div>

                  {/* Read-Only Safety Tag */}
                  <div className="list-col-readonly">
                    Read-Only
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EnquiryCounter;
