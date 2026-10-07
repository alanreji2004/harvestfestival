import React, { useState } from 'react';
import { formatCurrency } from '../utils/validation';

const CollectModal = ({
  isOpen,
  order,
  counterName,
  isLoading,
  error,
  onConfirm,
  onCancel
}) => {
  const [paymentMode, setPaymentMode] = useState('');
  const [remark, setRemark] = useState('');
  const [validationError, setValidationError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setPaymentMode('');
      setRemark('');
      setValidationError('');
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!paymentMode) {
      setValidationError('Please select a payment mode (GPay or Cash) before marking collected.');
      return;
    }
    setValidationError('');
    onConfirm(paymentMode, remark);
  };

  return (
    <div className="modal-backdrop" onClick={isLoading ? null : onCancel}>
      <div 
        className="modal-content collect-modal-content" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="collect-modal-title"
      >
        <div className="collect-modal-header">
          <h3 id="collect-modal-title" className="modal-title">COLLECT BIRIYANI</h3>
          <span className="counter-badge">{counterName}</span>
        </div>

        <div className="token-summary-card">
          <div className="token-summary-token">Token #{order.tokenNumber}</div>
          <div className="token-summary-details">
            <div className="summary-field">
              <span className="field-label">Name:</span>
              <span className="field-value">{order.name}</span>
            </div>
            <div className="summary-field">
              <span className="field-label">Phone:</span>
              <span className="field-value">{order.phone}</span>
            </div>
            <div className="summary-field">
              <span className="field-label">Biriyani Quantity:</span>
              <span className="field-value font-bold">{order.quantity}</span>
            </div>
            <div className="summary-field highlight-field">
              <span className="field-label">Total Amount:</span>
              <span className="field-value price-value">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {(error || validationError) && (
          <div className="alert alert-error mb-4" role="alert">
            {error || validationError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label className="payment-mode-label">
              Select Payment Mode <span className="required">*</span>
            </label>
            <div className="payment-mode-options">
              <label className={`payment-option ${paymentMode === 'gpay' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMode"
                  value="gpay"
                  checked={paymentMode === 'gpay'}
                  onChange={(e) => {
                    setPaymentMode(e.target.value);
                    setValidationError('');
                  }}
                  disabled={isLoading}
                />
                <span className="payment-title">GPay</span>
              </label>

              <label className={`payment-option ${paymentMode === 'cash' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMode"
                  value="cash"
                  checked={paymentMode === 'cash'}
                  onChange={(e) => {
                    setPaymentMode(e.target.value);
                    setValidationError('');
                  }}
                  disabled={isLoading}
                />
                <span className="payment-title">Cash</span>
              </label>
            </div>
          </div>

          <div className="form-group mb-4" style={{ textAlign: 'left' }}>
            <label className="form-label" htmlFor="collection-remark">
              Remark (Optional)
            </label>
            <textarea
              id="collection-remark"
              className="form-input"
              rows="2"
              placeholder="Add any remark regarding this collection..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={isLoading}
              style={{ resize: 'vertical' }}
            />
          </div>

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
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading || !paymentMode}
            >
              {isLoading ? (
                <span className="btn-loading">
                  <span className="spinner-small"></span> Processing...
                </span>
              ) : (
                'MARK AS COLLECTED'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectModal;
