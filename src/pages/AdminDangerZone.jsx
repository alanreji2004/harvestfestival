import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConfirmModal from '../components/ConfirmModal';
import { resetOrderCounter, getOrderCounter } from '../firebase/orders';

const AdminDangerZone = () => {
  const [currentCounter, setCurrentCounter] = useState(0);
  const [loadingCounter, setLoadingCounter] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchCounter = async () => {
    try {
      setLoadingCounter(true);
      const val = await getOrderCounter();
      setCurrentCounter(val);
    } catch (err) {
      setActionError('Failed to fetch current token counter.');
    } finally {
      setLoadingCounter(false);
    }
  };

  useEffect(() => {
    fetchCounter();
  }, []);

  const confirmResetCounter = async () => {
    setIsResetting(true);
    setActionError('');
    setActionSuccess('');

    try {
      await resetOrderCounter();
      setCurrentCounter(0);
      setActionSuccess('Order token counter has been successfully reset to 0. The next order will receive Token #1.');
      setShowResetModal(false);
    } catch (err) {
      setActionError(err.message || 'Failed to reset token counter.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Header isAdminView={true} />

      <main className="main-content container-narrow">
        {/* Admin Danger Zone Header Bar */}
        <div className="admin-header-bar mb-6" style={{ borderBottom: '2px solid #fecaca' }}>
          <div>
            <h2 className="admin-title" style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span> Admin Danger Zone
            </h2>
            <p className="admin-subtitle">Logged in as: <strong>{currentUser?.email}</strong></p>
          </div>
          <div className="admin-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/admin')}
            >
              &larr; Back to Dashboard
            </button>
          </div>
        </div>

        {/* Global Action Banners */}
        {actionError && (
          <div className="alert alert-error mb-4" role="alert">
            {actionError}
            <button className="alert-close" onClick={() => setActionError('')}>&times;</button>
          </div>
        )}
        {actionSuccess && (
          <div className="alert alert-success mb-4" role="alert">
            {actionSuccess}
            <button className="alert-close" onClick={() => setActionSuccess('')}>&times;</button>
          </div>
        )}

        {/* Danger Warning Callout */}
        <div 
          className="admin-dashboard-section mb-6"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '1.25rem'
          }}
        >
          <h3 style={{ color: '#991b1b', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '700' }}>
            ⚠️ High-Risk Administrative Actions
          </h3>
          <p style={{ color: '#7f1d1d', fontSize: '0.9rem', lineHeight: '1.5' }}>
            The settings on this page directly modify system counters and database configurations. 
            Please ensure you understand the consequences before performing any actions here.
          </p>
        </div>

        {/* Token Counter Reset Section */}
        <div className="admin-dashboard-section mb-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 className="admin-section-heading" style={{ margin: 0, color: '#dc2626' }}>
                RESET TOKEN COUNTER
              </h3>
              <p className="text-sm color-muted" style={{ marginTop: '4px' }}>
                Current Token Counter Value: <strong>{loadingCounter ? 'Loading...' : `#${currentCounter}`}</strong>
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.925rem', color: '#334155', marginBottom: '1rem', lineHeight: '1.5' }}>
              Resetting the order token counter sets the database counter back to <strong>0</strong>. 
              The very next order placed by a customer will be issued <strong>Token #1</strong>.
            </p>
            
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#92400e', margin: 0 }}>
                <strong>Warning:</strong> Only perform this operation when starting a completely new ordering event or after clearing old database orders.
              </p>
            </div>

            <button 
              type="button" 
              className="btn btn-danger"
              style={{ width: '100%', padding: '0.75rem', fontWeight: '700' }}
              onClick={() => setShowResetModal(true)}
            >
              Reset Token Counter to 0
            </button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal for Reset Token Counter */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Reset Token Counter?"
        message="This will make the next order receive token number 1. This action should only be performed when starting a new ordering period/event."
        warningText="WARNING: Resetting the counter while existing orders are still active in the database can create duplicate token numbers for new customers."
        confirmText="Confirm Reset Counter"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isResetting}
        onConfirm={confirmResetCounter}
        onCancel={() => setShowResetModal(false)}
      />

      <Footer />
    </div>
  );
};

export default AdminDangerZone;
