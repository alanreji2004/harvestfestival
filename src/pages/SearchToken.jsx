import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getOrdersByPhone } from '../firebase/orders';
import { formatCurrency, formatDate } from '../utils/validation';

const SearchToken = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPhoneParam = searchParams.get('phone') || '';

  const [phone, setPhone] = useState(initialPhoneParam);
  const [isSearching, setIsSearching] = useState(false);
  const [orders, setOrders] = useState(null);
  const [searchedPhone, setSearchedPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const executeSearch = async (phoneToSearch) => {
    if (!phoneToSearch || !phoneToSearch.trim()) {
      setErrorMsg('Please enter a mobile number to search.');
      return;
    }

    setErrorMsg('');
    setIsSearching(true);
    setOrders(null);
    setSearchedPhone(phoneToSearch.trim());

    try {
      const results = await getOrdersByPhone(phoneToSearch);
      setOrders(results);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to search orders. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialPhoneParam) {
      executeSearch(initialPhoneParam);
    }
  }, [initialPhoneParam]);

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(phone);
  };

  return (
    <div className="page-wrapper">
      <Header />
      <main className="main-content container-narrow">
        {/* Navigation back */}
        <div className="mb-4">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/bookingclosed')}
          >
            &larr; Back to Booking Status
          </button>
        </div>

        {/* Search Input Card */}
        <div className="order-card mb-6">
          <div className="card-header">
            <h2>Search Token Number</h2>
            <p>Enter your 10-digit mobile number to view details of all your placed orders.</p>
          </div>

          {errorMsg && (
            <div className="alert alert-error mb-4" role="alert">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSearch} noValidate>
            <div className="form-group mb-4">
              <label htmlFor="search-phone">Mobile Number <span className="required">*</span></label>
              <input
                type="tel"
                id="search-phone"
                className="form-input"
                placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                disabled={isSearching}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={isSearching || !phone.trim()}
            >
              {isSearching ? (
                <span className="btn-loading">
                  <span className="spinner-small"></span> Searching Orders...
                </span>
              ) : (
                'Search Orders'
              )}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {orders !== null && (
          <div className="search-results-section">
            {orders.length > 0 ? (
              <div>
                <div className="results-header mb-4">
                  <h3>
                    Found {orders.length} Order{orders.length > 1 ? 's' : ''} for <span className="highlight-phone">{searchedPhone}</span>
                  </h3>
                </div>

                <div className="orders-list">
                  {orders.map((order) => (
                    <div key={order.id || order.tokenNumber} className="token-result-card mb-4">
                      <div className="token-card-top">
                        <div className="token-badge">
                          Token #{order.tokenNumber}
                        </div>
                        <div className={`status-badge status-${order.collectionStatus || 'pending'}`}>
                          {order.collectionStatus === 'collected' ? (
                            <>✓ Collected ({order.collectedByCounter || 'Counter'})</>
                          ) : (
                            <>⏳ Pending Collection</>
                          )}
                        </div>
                      </div>

                      <div className="token-card-body">
                        <div className="detail-row">
                          <span className="detail-label">Customer Name:</span>
                          <span className="detail-value font-semibold">{order.name}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Mobile Number:</span>
                          <span className="detail-value">{order.phone}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Quantity:</span>
                          <span className="detail-value font-bold">{order.quantity} Biriyani</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Total Amount:</span>
                          <span className="detail-value total-amount-highlight">{formatCurrency(order.totalAmount || (order.quantity * 180))}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Event Date:</span>
                          <span className="detail-value">October 11, 2026</span>
                        </div>
                        {order.createdAt && (
                          <div className="detail-row">
                            <span className="detail-label">Order Placed:</span>
                            <span className="detail-value color-muted text-sm">{formatDate(order.createdAt)}</span>
                          </div>
                        )}
                        {order.collectionStatus === 'collected' && order.paymentMode && (
                          <div className="detail-row">
                            <span className="detail-label">Payment Mode:</span>
                            <span className="detail-value uppercase font-semibold">{order.paymentMode}</span>
                          </div>
                        )}
                      </div>

                      <div className="token-card-footer">
                        <p className="counter-note">
                          📌 Please present this token number at the festival counter on <strong>October 11, 2026</strong> for collection.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-results-card text-center p-6">
                <div className="no-results-icon">🔎</div>
                <h3>No Orders Found</h3>
                <p>
                  No orders were found associated with mobile number <strong>{searchedPhone}</strong>.
                </p>
                <p className="text-sm color-muted mt-2">
                  Please verify the mobile number entered. If you need assistance, please contact Alan Reji at <a href="tel:9188851735">9188851735</a>.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SearchToken;
