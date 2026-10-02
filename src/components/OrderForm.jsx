import React, { useState } from 'react';
import { validateName, validatePhone, validateQuantity, formatCurrency } from '../utils/validation';
import { createOrder } from '../firebase/orders';

const PRICE_PER_BIRIYANI = 180;

const OrderForm = ({ onOrderSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    quantity: 1
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for changed field
    setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError('');

    if (name === 'quantity') {
      // Allow user to clear field or type numbers
      const val = value === '' ? '' : parseInt(value, 10);
      setFormData(prev => ({ ...prev, quantity: val }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleQuantityIncrement = (delta) => {
    setErrors(prev => ({ ...prev, quantity: '' }));
    setFormData(prev => {
      const current = typeof prev.quantity === 'number' ? prev.quantity : 1;
      const nextVal = Math.max(1, current + delta);
      return { ...prev, quantity: nextVal };
    });
  };

  const calculateTotal = () => {
    const qty = typeof formData.quantity === 'number' && formData.quantity > 0 ? formData.quantity : 0;
    return qty * PRICE_PER_BIRIYANI;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate inputs
    const nameVal = validateName(formData.name);
    const phoneVal = validatePhone(formData.phone);
    const qtyVal = validateQuantity(formData.quantity);

    const newErrors = {};
    if (!nameVal.isValid) newErrors.name = nameVal.message;
    if (!phoneVal.isValid) newErrors.phone = phoneVal.message;
    if (!qtyVal.isValid) newErrors.quantity = qtyVal.message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      const result = await createOrder({
        name: formData.name,
        phone: phoneVal.normalizedPhone,
        quantity: qtyVal.quantity
      });

      if (result.success) {
        onOrderSuccess(result.order);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to place order. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTotal = calculateTotal();

  return (
    <div className="order-card">
      <div className="card-header">
        <h2>Place Your Biriyani Order</h2>
        <p className="unit-price">Price: <strong>₹{PRICE_PER_BIRIYANI}</strong> per biriyani</p>
      </div>

      {serverError && (
        <div className="alert alert-error" role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="name">Full Name <span className="required">*</span></label>
          <input
            type="text"
            id="name"
            name="name"
            className={`form-input ${errors.name ? 'input-error' : ''}`}
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={isSubmitting}
            required
            autoComplete="name"
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        {/* Phone Number */}
        <div className="form-group">
          <label htmlFor="phone">Phone Number <span className="required">*</span></label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className={`form-input ${errors.phone ? 'input-error' : ''}`}
            placeholder="Enter 10-digit mobile number"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={isSubmitting}
            required
            autoComplete="tel"
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        {/* Number of Biriyani */}
        <div className="form-group">
          <label htmlFor="quantity">Number of Biriyani <span className="required">*</span></label>
          <div className="quantity-controls">
            <button
              type="button"
              className="qty-btn"
              onClick={() => handleQuantityIncrement(-1)}
              disabled={isSubmitting || formData.quantity <= 1}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              step="1"
              className={`form-input qty-input ${errors.quantity ? 'input-error' : ''}`}
              value={formData.quantity}
              onChange={handleInputChange}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              className="qty-btn"
              onClick={() => handleQuantityIncrement(1)}
              disabled={isSubmitting}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          {errors.quantity && <span className="error-message">{errors.quantity}</span>}
        </div>

        {/* Total Summary Box */}
        <div className="total-summary-card">
          <div className="summary-row">
            <span>Price per biriyani</span>
            <span>₹{PRICE_PER_BIRIYANI}</span>
          </div>
          <div className="summary-row">
            <span>Quantity</span>
            <span>{formData.quantity || 0}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total Amount</span>
            <span className="total-price">{formatCurrency(currentTotal)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="btn-loading">
              <span className="spinner-small"></span> Placing Order...
            </span>
          ) : (
            'Place Order'
          )}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
