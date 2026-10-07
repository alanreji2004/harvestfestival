import React, { useState, useEffect, useMemo } from 'react';
import { generateOrderTagsPdf } from '../utils/generateOrderTagsPdf';
import '../styles/orderTags.css';

const OrderTagGeneratorModal = ({ isOpen, orders = [], onClose }) => {
  const [mode, setMode] = useState('all'); // 'all' | 'uncollected' | 'selected'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('all');
      setSelectedIds(new Set());
      setSearchQuery('');
      setIsGenerating(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isGenerating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGenerating, onClose]);

  // Computed subsets
  const uncollectedOrders = useMemo(() => {
    return orders.filter(o => o.collectionStatus !== 'collected');
  }, [orders]);

  // Filtered orders for the "Select Orders" selection table
  const filteredOrdersForSelection = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const sorted = [...orders].sort((a, b) => (Number(a.tokenNumber) || 0) - (Number(b.tokenNumber) || 0));

    if (!q) return sorted;

    return sorted.filter((ord) => {
      const tokenStr = String(ord.tokenNumber || '');
      const nameStr = (ord.name || '').toLowerCase();
      const phoneStr = ord.phone || '';
      return tokenStr.includes(q) || nameStr.includes(q) || phoneStr.includes(q);
    });
  }, [orders, searchQuery]);

  if (!isOpen) return null;

  // Toggle individual order selection
  const handleToggleOrder = (orderId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Toggle Select All visible orders
  const handleToggleSelectAllVisible = () => {
    const visibleIds = filteredOrdersForSelection.map(o => o.id);
    const allVisibleSelected = visibleIds.every(id => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach(id => next.delete(id));
      } else {
        visibleIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // Handle PDF Generation
  const handleGeneratePdf = () => {
    setErrorMsg('');

    let targetOrders = [];
    if (mode === 'all') {
      targetOrders = orders;
    } else if (mode === 'uncollected') {
      targetOrders = uncollectedOrders;
    } else if (mode === 'selected') {
      targetOrders = orders.filter(o => selectedIds.has(o.id));
    }

    if (!targetOrders || targetOrders.length === 0) {
      setErrorMsg('No orders available to generate order tags.');
      return;
    }

    setIsGenerating(true);

    try {
      generateOrderTagsPdf(targetOrders, mode);
      setIsGenerating(false);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate Order Tags PDF.');
      setIsGenerating(false);
    }
  };

  const getTargetCount = () => {
    if (mode === 'all') return orders.length;
    if (mode === 'uncollected') return uncollectedOrders.length;
    if (mode === 'selected') return selectedIds.size;
    return 0;
  };

  const targetCount = getTargetCount();
  const allVisibleSelected = filteredOrdersForSelection.length > 0 &&
    filteredOrdersForSelection.every(o => selectedIds.has(o.id));

  return (
    <div className="modal-backdrop" onClick={isGenerating ? null : onClose}>
      <div
        className="modal-content order-tags-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-tags-title"
      >
        {/* Header */}
        <div className="order-tags-modal-header">
          <h3 id="order-tags-title" className="order-tags-modal-title">
            🏷️ Order Tag PDF Generator
          </h3>
          <button
            type="button"
            className="order-tags-modal-close"
            onClick={onClose}
            disabled={isGenerating}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Error alert banner */}
        {errorMsg && (
          <div className="alert alert-error mb-4" role="alert">
            {errorMsg}
            <button className="alert-close" onClick={() => setErrorMsg('')}>&times;</button>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="order-tags-mode-tabs">
          <button
            type="button"
            className={`order-tags-tab-btn ${mode === 'all' ? 'active' : ''}`}
            onClick={() => { setMode('all'); setErrorMsg(''); }}
            disabled={isGenerating}
          >
            Download All Tags ({orders.length})
          </button>
          <button
            type="button"
            className={`order-tags-tab-btn ${mode === 'uncollected' ? 'active' : ''}`}
            onClick={() => { setMode('uncollected'); setErrorMsg(''); }}
            disabled={isGenerating}
          >
            Uncollected Tags ({uncollectedOrders.length})
          </button>
          <button
            type="button"
            className={`order-tags-tab-btn ${mode === 'selected' ? 'active' : ''}`}
            onClick={() => { setMode('selected'); setErrorMsg(''); }}
            disabled={isGenerating}
          >
            Select Specific Orders ({selectedIds.size})
          </button>
        </div>

        {/* Tab 1: All Orders Info */}
        {mode === 'all' && (
          <div className="order-tags-preview-info">
            <div className="order-tags-info-row">
              <span>Selected Option: <strong>All Orders</strong></span>
              <span>Total Tags: <strong>{orders.length}</strong></span>
            </div>
            <p className="text-sm color-muted mt-2">
              Generates physical order tags for all {orders.length} orders currently stored in the database.
            </p>
          </div>
        )}

        {/* Tab 2: Uncollected Orders Info */}
        {mode === 'uncollected' && (
          <div className="order-tags-preview-info">
            <div className="order-tags-info-row">
              <span>Selected Option: <strong>Uncollected Orders</strong></span>
              <span>Pending Tags: <strong>{uncollectedOrders.length}</strong></span>
            </div>
            <p className="text-sm color-muted mt-2">
              Generates physical order tags only for orders whose collection status is pending ({uncollectedOrders.length} orders).
            </p>
          </div>
        )}

        {/* Tab 3: Interactive Select Orders Table */}
        {mode === 'selected' && (
          <div className="order-tags-selection-wrapper">
            <div className="order-tags-toolbar">
              <input
                type="text"
                className="form-input order-tags-search-input"
                placeholder="Filter Token #, Name, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handleToggleSelectAllVisible}
                  disabled={filteredOrdersForSelection.length === 0}
                >
                  {allVisibleSelected ? 'Deselect Visible' : 'Select Visible'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={selectedIds.size === 0}
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="order-tags-selection-table-container">
              {filteredOrdersForSelection.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                  No orders match your filter query.
                </div>
              ) : (
                <table className="order-tags-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="order-tags-checkbox"
                          checked={allVisibleSelected}
                          onChange={handleToggleSelectAllVisible}
                        />
                      </th>
                      <th>Token</th>
                      <th>Customer Name</th>
                      <th>Qty</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrdersForSelection.map((ord) => {
                      const isSelected = selectedIds.has(ord.id);
                      const isCollected = ord.collectionStatus === 'collected';
                      return (
                        <tr
                          key={ord.id}
                          onClick={() => handleToggleOrder(ord.id)}
                          style={{ cursor: 'pointer', backgroundColor: isSelected ? 'var(--bg-hover, #fff7ed)' : 'transparent' }}
                        >
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="order-tags-checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleOrder(ord.id)}
                            />
                          </td>
                          <td>
                            <span className="token-pill">#{ord.tokenNumber}</span>
                          </td>
                          <td className="font-semibold">{ord.name}</td>
                          <td>{ord.quantity}</td>
                          <td>Rs. {ord.totalAmount}</td>
                          <td>
                            <span className={`status-pill ${isCollected ? 'pill-success' : 'pill-pending'}`}>
                              {isCollected ? 'Collected' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="order-tags-modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGeneratePdf}
            disabled={isGenerating || targetCount === 0}
          >
            {isGenerating ? 'Generating PDF...' : `Download Order Tags (${targetCount})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTagGeneratorModal;
