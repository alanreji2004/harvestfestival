import React from 'react';
import { formatCurrency } from '../utils/validation';

const OrderSuccess = ({ order, onReset }) => {
  if (!order) return null;

  return (
    <div className="success-card">
      <div className="success-badge-header">
        <span className="success-status-text">ORDER SUCCESSFUL</span>
      </div>

      <div className="token-display-box">
        <div className="token-label">TOKEN</div>
        <div className="token-number">{order.tokenNumber}</div>
      </div>

      <div className="order-details-card">
        <div className="detail-row">
          <span className="detail-label">Name:</span>
          <span className="detail-value">{order.name}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Phone:</span>
          <span className="detail-value">{order.phone}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Biriyani:</span>
          <span className="detail-value">{order.quantity}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Total Amount:</span>
          <span className="detail-value total-highlight">{formatCurrency(order.totalAmount)}</span>
        </div>
        <div className="detail-row date-row">
          <span className="detail-label">Distribution Date:</span>
          <span className="detail-value">October 11, 2026</span>
        </div>
      </div>

      <div className="success-info-note">
        Please save or take a screenshot of your token number for collection on October 11, 2026.
      </div>

      <button 
        type="button" 
        className="btn btn-primary btn-block btn-lg"
        onClick={onReset}
      >
        Place Another Order
      </button>
    </div>
  );
};

export default OrderSuccess;
