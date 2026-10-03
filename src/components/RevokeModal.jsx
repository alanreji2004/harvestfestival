import React from 'react';
import { formatCurrency } from '../utils/validation';

const RevokeModal = ({
  isOpen,
  order,
  isLoading,
  error,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="modal-backdrop" onClick={isLoading ? null : onCancel}>
      <div 
        className="modal-content collect-modal-content" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="revoke-modal-title"
      >
        <div className="collect-modal-header">
          <h3 id="revoke-modal-title" className="modal-title text-danger-color">REVOKE COLLECTION</h3>
        </div>

        <div className="token-summary-card">
          <div className="token-summary-token">Token #{order.tokenNumber}</div>
          <div className="token-summary-details">
            <div className="summary-field">
              <span className="field-label">Name:</span>
              <span className="field-value">{order.name}</span>
            </div>
            <div className="summary-field">
              <span className="field-label">Quantity:</span>
              <span className="field-value font-bold">{order.quantity} Biriyani</span>
            </div>
            <div className="summary-field highlight-field">
              <span className="field-label">Total Amount:</span>
              <span className="field-value price-value">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="modal-warning mb-4" style={{ textAlign: 'left', background: '#fff5f5', borderLeft: '4px solid #e53e3e', padding: '12px' }}>
          <p className="font-semibold mb-1" style={{ color: '#c53030' }}>Currently marked as:</p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#4a5568' }}>
            <li>Status: <strong>Collected</strong></li>
            <li>Payment: <strong>{order.paymentMode === 'gpay' ? 'GPay' : order.paymentMode === 'cash' ? 'Cash' : order.paymentMode}</strong></li>
            <li>Counter: <strong>{order.collectedByCounter || 'Unknown'}</strong></li>
          </ul>
        </div>

        <p className="text-sm color-muted mb-4" style={{ textAlign: 'left' }}>
          Are you sure you want to revoke this collection?<br />
          The order will return to <strong>"Not Collected"</strong> and its payment amount will be removed from all collection totals.
        </p>

        {error && (
          <div className="alert alert-error mb-4" role="alert">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner-small"></span> Revoking...
              </span>
            ) : (
              'Revoke Collection'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevokeModal;
