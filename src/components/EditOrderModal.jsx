import React, { useState, useEffect } from 'react';
import { validateName, validatePhone, validateQuantity, formatCurrency } from '../utils/validation';

const PRICE_PER_BIRIYANI = 180;

const EditOrderModal = ({
  isOpen,
  order,
  isLoading,
  error,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [confirmedCollectedChange, setConfirmedCollectedChange] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (order) {
      setName(order.name || '');
      setPhone(order.phone || '');
      setQuantity(Number(order.quantity) || 1);
      setConfirmedCollectedChange(false);
      setValidationError('');
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const isCollected = order.collectionStatus === 'collected';
  const calculatedTotal = (Number(quantity) || 0) * PRICE_PER_BIRIYANI;

  const handleQuantityChange = (val) => {
    setValidationError('');
    setQuantity(val);
  };

  const handleDecrement = () => {
    const current = Number(quantity) || 1;
    if (current > 1) {
      handleQuantityChange(current - 1);
    }
  };

  const handleIncrement = () => {
    const current = Number(quantity) || 0;
    handleQuantityChange(current + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    // 1. Validate Name
    const nameResult = validateName(name);
    if (!nameResult.isValid) {
      setValidationError(nameResult.message);
      return;
    }

    // 2. Validate Phone
    const phoneResult = validatePhone(phone);
    if (!phoneResult.isValid) {
      setValidationError(phoneResult.message);
      return;
    }

    // 3. Validate Quantity
    const qtyResult = validateQuantity(quantity);
    if (!qtyResult.isValid) {
      setValidationError(qtyResult.message);
      return;
    }

    // 4. If collected order and quantity changed, ensure admin confirmed warning
    if (isCollected && Number(order.quantity) !== qtyResult.quantity && !confirmedCollectedChange) {
      setValidationError('Please check the warning confirmation checkbox to save changes for an already collected order.');
      return;
    }

    onSave({
      name: name.trim(),
      phone: phoneResult.normalizedPhone,
      quantity: qtyResult.quantity
    });
  };

  return (
    <div className="modal-backdrop" onClick={isLoading ? null : onCancel}>
      <div 
        className="modal-content collect-modal-content" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="edit-modal-title"
      >
        <div className="collect-modal-header">
          <h3 id="edit-modal-title" className="modal-title">
            EDIT ORDER #{order.tokenNumber}
          </h3>
        </div>

        {/* Warning if already collected */}
        {isCollected && (
          <div 
            className="modal-warning mb-4" 
            style={{ 
              textAlign: 'left', 
              background: '#fffaf0', 
              borderLeft: '4px solid #dd6b20', 
              padding: '12px',
              borderRadius: '4px'
            }}
          >
            <p className="font-semibold mb-1" style={{ color: '#c05621' }}>
              ⚠️ Order Already Collected
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#744210' }}>
              This order has already been collected. Changing the quantity may affect the recorded collection amount.
            </p>
          </div>
        )}

        {(error || validationError) && (
          <div className="alert alert-error mb-4" role="alert">
            {error || validationError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer Name */}
          <div className="form-group mb-4" style={{ textAlign: 'left' }}>
            <label className="form-label" htmlFor="edit-name">
              Customer Name <span className="required">*</span>
            </label>
            <input
              id="edit-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setValidationError('');
              }}
              disabled={isLoading}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="form-group mb-4" style={{ textAlign: 'left' }}>
            <label className="form-label" htmlFor="edit-phone">
              Phone Number <span className="required">*</span>
            </label>
            <input
              id="edit-phone"
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setValidationError('');
              }}
              disabled={isLoading}
              required
            />
          </div>

          {/* Biriyani Quantity */}
          <div className="form-group mb-4" style={{ textAlign: 'left' }}>
            <label className="form-label">
              Biriyani Count <span className="required">*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem', fontWeight: 'bold' }}
                onClick={handleDecrement}
                disabled={isLoading || Number(quantity) <= 1}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', width: '90px' }}
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem', fontWeight: 'bold' }}
                onClick={handleIncrement}
                disabled={isLoading}
              >
                +
              </button>
            </div>
          </div>

          {/* Automatic Total Amount Display */}
          <div className="token-summary-card mb-4" style={{ margin: '16px 0' }}>
            <div className="summary-field highlight-field" style={{ justifyContent: 'space-between' }}>
              <span className="field-label">Calculated Total ({quantity} × ₹180):</span>
              <span className="field-value price-value">{formatCurrency(calculatedTotal)}</span>
            </div>
          </div>

          {/* Checkbox confirmation for collected order quantity edit if modified */}
          {isCollected && (
            <div className="form-group mb-4" style={{ textAlign: 'left' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#4a5568' }}>
                <input
                  type="checkbox"
                  checked={confirmedCollectedChange}
                  onChange={(e) => {
                    setConfirmedCollectedChange(e.target.checked);
                    setValidationError('');
                  }}
                  disabled={isLoading}
                  style={{ marginTop: '3px' }}
                />
                <span>I confirm updating this already collected order.</span>
              </label>
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
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-loading">
                  <span className="spinner-small"></span> Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrderModal;
