import React, { useState, useEffect } from 'react';

const COUNTER_PASSWORD = 'jskundaraya';

const CounterPasswordModal = ({
  isOpen,
  counterName,
  onSuccess,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the counter security password.');
      return;
    }

    if (password.trim() === COUNTER_PASSWORD) {
      setError('');
      onSuccess();
    } else {
      setError('Incorrect counter password. Access denied.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div 
        className="modal-content collect-modal-content" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="counter-password-title"
      >
        <div className="collect-modal-header">
          <h3 id="counter-password-title" className="modal-title">COUNTER ACCESS SECURITY</h3>
          <span className="counter-badge">{counterName}</span>
        </div>

        <p className="text-sm color-muted mb-4" style={{ textAlign: 'left' }}>
          Please enter the security password to access <strong>{counterName}</strong> distribution dashboard.
        </p>

        {error && (
          <div className="alert alert-error mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4" style={{ textAlign: 'left' }}>
            <label htmlFor="counter-password-input" className="form-label font-semibold">
              Security Password <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="counter-password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoFocus
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              Access Counter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CounterPasswordModal;
