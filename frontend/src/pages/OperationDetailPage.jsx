import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Printer, Check, XCircle, Plus, Trash2, AlertCircle, Save } from 'lucide-react';

export default function OperationDetailPage({ docId, type, setView, setToast }) {
  const [doc, setDoc] = useState(null);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docRes, prodRes, locRes, partnerRes] = await Promise.all([
        api.getOperation(docId),
        api.getProducts(),
        api.getLocations(),
        api.getPartners(),
      ]);
      setDoc(docRes.data);
      setProducts(prodRes.data);
      setLocations(locRes.data);
      setPartners(partnerRes.data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load document details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) loadData();
  }, [docId]);

  if (loading || !doc) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        Loading document details...
      </div>
    );
  }

  const isEditable = doc.status !== 'Done' && doc.status !== 'Canceled';
  const isAdjustment = doc.type === 'adjustment';
  const isDelivery = doc.type === 'delivery';
  const isReceipt = doc.type === 'receipt';
  const isTransfer = doc.type === 'transfer';

  // Check stock availability for delivery orders
  const hasDeliveryShortage =
    isDelivery &&
    doc.lines.some((ln) => {
      const available = parseFloat(ln.current_source_stock || 0);
      const requested = parseFloat(ln.quantity || 0);
      return available < requested;
    });

  const handleFieldChange = (field, val) => {
    setDoc({ ...doc, [field]: val });
  };

  const handleLineChange = (index, field, val) => {
    const updatedLines = [...doc.lines];
    updatedLines[index][field] = val;

    // If product changed, update current source stock
    if (field === 'product_id') {
      const selectedProd = products.find((p) => p.id === parseInt(val, 10));
      if (selectedProd) {
        updatedLines[index].product_name = selectedProd.name;
        updatedLines[index].product_uom = selectedProd.uom;
      }
    }

    setDoc({ ...doc, lines: updatedLines });
  };

  const handleAddLine = () => {
    const firstProd = products[0];
    const newLine = {
      product_id: firstProd ? firstProd.id : null,
      product_name: firstProd ? firstProd.name : '',
      product_uom: firstProd ? firstProd.uom : 'unit',
      quantity: 1,
      counted_quantity: 0,
      current_source_stock: 0,
    };
    setDoc({ ...doc, lines: [...doc.lines, newLine] });
  };

  const handleRemoveLine = (index) => {
    const updated = doc.lines.filter((_, i) => i !== index);
    setDoc({ ...doc, lines: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateOperation(doc.id, {
        partner_id: doc.partner_id,
        source_location_id: doc.source_location_id,
        dest_location_id: doc.dest_location_id,
        scheduled_date: doc.scheduled_date,
        notes: doc.notes,
        lines: doc.lines,
        status: isDelivery ? (hasDeliveryShortage ? 'Waiting' : 'Ready') : doc.status,
      });
      setToast({ type: 'success', message: 'Document saved successfully.' });
      loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save document.' });
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      // First save changes
      await api.updateOperation(doc.id, {
        partner_id: doc.partner_id,
        source_location_id: doc.source_location_id,
        dest_location_id: doc.dest_location_id,
        scheduled_date: doc.scheduled_date,
        notes: doc.notes,
        lines: doc.lines,
      });

      // Then validate with ACID transaction in backend
      const res = await api.validateOperation(doc.id);
      setToast({
        type: 'success',
        title: 'Validation Successful',
        message: res.message || 'Stock levels updated and transaction logged to Stock Ledger.',
      });
      loadData();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Validation Error',
        message: err.message || 'Could not validate operation.',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this operation?')) return;
    try {
      await api.cancelOperation(doc.id);
      setToast({ type: 'info', message: 'Operation has been marked as Canceled.' });
      loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to cancel operation.' });
    }
  };

  const backMap = {
    receipt: 'receipts',
    delivery: 'deliveries',
    transfer: 'transfers',
    adjustment: 'adjustments',
  };

  const backView = backMap[doc.type] || 'dashboard';

  return (
    <div>
      {/* Top Back Navigation & Document Flow */}
      <div className="no-print" style={{ marginBottom: '16px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setView(backView)}
          style={{ gap: '6px' }}
        >
          <ArrowLeft size={14} /> Back to {doc.type}s
        </button>
      </div>

      <div className="card" style={{ padding: '28px' }}>
        {/* Document Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '20px',
            marginBottom: '24px',
          }}
        >
          <div>
            <div className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>
              {doc.reference}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {isReceipt && 'Draft → Ready → Done'}
              {isDelivery && 'Draft → Waiting / Ready → Done'}
              {isTransfer && 'Draft → Ready → Done'}
              {isAdjustment && 'Draft → Done'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <StatusBadge status={hasDeliveryShortage && isEditable ? 'Waiting' : doc.status} />

            <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => window.print()} title="Print document">
                <Printer size={15} /> Print
              </button>

              {isEditable && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={handleSave} disabled={saving}>
                    <Save size={15} /> Save
                  </button>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleValidate}
                    disabled={validating || (isDelivery && hasDeliveryShortage)}
                    title={isDelivery && hasDeliveryShortage ? 'Cannot validate: Stock shortage' : 'Validate and update stock'}
                  >
                    <Check size={15} /> Validate
                  </button>

                  <button className="btn btn-danger btn-sm" onClick={handleCancel}>
                    <XCircle size={15} /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Shortage Warning Alert */}
        {isDelivery && hasDeliveryShortage && isEditable && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--accent)',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} />
            <span>
              <strong>Insufficient Stock:</strong> One or more products have lower free stock at the source location than requested. The order status is <strong>Waiting</strong> until replenished.
            </span>
          </div>
        )}

        {/* Document Metadata Form */}
        <div className="grid-2" style={{ marginBottom: '24px' }}>
          {/* Partner (Vendor for Receipt, Customer for Delivery) */}
          {(isReceipt || isDelivery) && (
            <div className="form-group">
              <label>{isReceipt ? 'Vendor / Supplier' : 'Customer'}</label>
              <select
                className="select"
                disabled={!isEditable}
                value={doc.partner_id || ''}
                onChange={(e) => handleFieldChange('partner_id', e.target.value ? parseInt(e.target.value, 10) : null)}
              >
                <option value="">Select Partner</option>
                {partners
                  .filter((p) => (isReceipt ? p.type === 'vendor' : p.type === 'customer'))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Location Fields */}
          {(isReceipt || isTransfer) && (
            <div className="form-group">
              <label>{isReceipt ? 'Destination Location (To)' : 'To Location'}</label>
              <select
                className="select"
                disabled={!isEditable}
                value={doc.dest_location_id || ''}
                onChange={(e) => handleFieldChange('dest_location_id', parseInt(e.target.value, 10))}
              >
                <option value="">Select Destination Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {(isDelivery || isTransfer || isAdjustment) && (
            <div className="form-group">
              <label>{isAdjustment ? 'Adjustment Location' : (isTransfer ? 'From Location' : 'Source Location (From)')}</label>
              <select
                className="select"
                disabled={!isEditable}
                value={doc.source_location_id || ''}
                onChange={(e) => handleFieldChange('source_location_id', parseInt(e.target.value, 10))}
              >
                <option value="">Select Source Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scheduled Date */}
          <div className="form-group">
            <label>Scheduled Date</label>
            <input
              type="date"
              className="input"
              disabled={!isEditable}
              value={doc.scheduled_date ? doc.scheduled_date.slice(0, 10) : ''}
              onChange={(e) => handleFieldChange('scheduled_date', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Notes / Memo</label>
            <input
              className="input"
              placeholder="e.g. PO-8902 or Carrier tracking"
              disabled={!isEditable}
              value={doc.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
            />
          </div>
        </div>

        {/* Lines Section */}
        <div style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Products</h3>
            {isEditable && (
              <button className="btn btn-ghost btn-sm no-print" onClick={handleAddLine}>
                <Plus size={14} /> Add Product
              </button>
            )}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  {isDelivery && <th>Available Stock</th>}
                  {isAdjustment ? <th>Recorded</th> : null}
                  <th>{isAdjustment ? 'Counted' : 'Quantity'}</th>
                  {isAdjustment && <th>Difference</th>}
                  {isEditable && <th style={{ width: '50px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {doc.lines.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No product lines added yet. Click "+ Add Product".
                    </td>
                  </tr>
                ) : (
                  doc.lines.map((ln, idx) => {
                    const recorded = parseFloat(ln.current_source_stock || 0);
                    const counted = parseFloat(ln.counted_quantity !== null && ln.counted_quantity !== undefined ? ln.counted_quantity : ln.quantity);
                    const diff = counted - recorded;
                    const isShortage = isDelivery && recorded < parseFloat(ln.quantity);

                    return (
                      <tr key={idx}>
                        <td style={{ minWidth: '220px' }}>
                          {isEditable ? (
                            <select
                              className="select"
                              style={{ padding: '6px 10px', fontSize: '13px' }}
                              value={ln.product_id || ''}
                              onChange={(e) => handleLineChange(idx, 'product_id', parseInt(e.target.value, 10))}
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div>
                              <strong>{ln.product_name}</strong>
                              <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                {ln.product_sku}
                              </span>
                            </div>
                          )}
                        </td>

                        {isDelivery && (
                          <td>
                            <span style={{ fontWeight: 600, color: isShortage ? 'var(--red)' : 'var(--green)' }}>
                              {recorded} {ln.product_uom}
                            </span>
                            {isShortage && (
                              <span className="badge badge-waiting" style={{ marginLeft: '6px', fontSize: '10.5px' }}>
                                Shortage
                              </span>
                            )}
                          </td>
                        )}

                        {isAdjustment && <td>{recorded}</td>}

                        <td style={{ width: '140px' }}>
                          <input
                            type="number"
                            min="0"
                            className="input"
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            disabled={!isEditable}
                            value={isAdjustment ? (ln.counted_quantity !== null ? ln.counted_quantity : ln.quantity) : ln.quantity}
                            onChange={(e) =>
                              handleLineChange(
                                idx,
                                isAdjustment ? 'counted_quantity' : 'quantity',
                                e.target.value
                              )
                            }
                          />
                        </td>

                        {isAdjustment && (
                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                color: diff === 0 ? 'var(--text-muted)' : diff > 0 ? 'var(--green)' : 'var(--red)',
                              }}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </td>
                        )}

                        {isEditable && (
                          <td className="no-print">
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '6px', color: 'var(--red)' }}
                              onClick={() => handleRemoveLine(idx)}
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
