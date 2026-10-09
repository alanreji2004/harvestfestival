import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BookingClosed = () => {
  const navigate = useNavigate();
  const [quickPhone, setQuickPhone] = useState('');

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickPhone.trim()) {
      navigate(`/search-token?phone=${encodeURIComponent(quickPhone.trim())}`);
    } else {
      navigate('/search-token');
    }
  };

  return (
    <div className="page-wrapper">
      <Header />
      <main className="main-content container-narrow">
        {/* 1. Booking Closed Status Banner */}
        <div className="booking-closed-card text-center mb-6">
          <div className="status-icon-wrapper">
            <span className="status-icon">🚫</span>
          </div>
          <h2 className="closed-title">Oops! No orders are taking now</h2>
          <p className="closed-subtitle">
            Biriyani booking for <strong>Harvest Festival 2026</strong> is currently closed.
          </p>
        </div>

        {/* 2. Search Token Box (FIRST) */}
        <div className="search-token-promo-card text-center mb-6">
          <div className="search-icon-wrapper">
            <span className="search-icon">🔍</span>
          </div>
          <h3>Already Placed An Order?</h3>
          <p className="mb-4">
            Enter your registered mobile number below to search your token number and order details.
          </p>

          <form onSubmit={handleQuickSearch} className="quick-search-form">
            <div className="form-group mb-3">
              <input
                type="tel"
                className="form-input text-center"
                placeholder="Enter 10-digit mobile number"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
            >
              Search Token Number
            </button>
          </form>
        </div>

        {/* 3. Contact & Support Box (SECOND) */}
        <div className="contact-box-card mb-6">
          <h3 className="box-title">Contact & Support</h3>
          <p className="box-description">
            If you have any questions regarding your order or festival distribution, please reach out to us:
          </p>

          <div className="contact-list">
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <div className="contact-details">
                <span className="contact-label">Contact Person</span>
                <span className="contact-value">Alan Reji : 9188851735</span>
              </div>
              <div className="contact-actions">
                <a 
                  href="tel:9188851735" 
                  className="btn btn-sm btn-secondary"
                  title="Call Alan Reji"
                >
                  Call
                </a>
                <a 
                  href="https://wa.me/919188851735" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-sm btn-whatsapp"
                  title="WhatsApp Alan Reji"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">✉️</div>
              <div className="contact-details">
                <span className="contact-label">Email Us</span>
                <a 
                  href="mailto:stmarysyouthassociationkundara@gmail.com" 
                  className="contact-email-link"
                >
                  stmarysyouthassociationkundara@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingClosed;
