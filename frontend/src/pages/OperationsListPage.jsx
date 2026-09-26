import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { Plus, Search, Calendar, Filter } from 'lucide-react';

export default function OperationsListPage({ type, setView, setSelectedDocId, setToast }) {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const configMap = {
    receipt: {
      title: 'Receipts',
      subtitle: 'Manage incoming goods received from vendors and suppliers.',
      newBtn: 'New Receipt',
      partnerLabel: 'Vendor',
      locLabel: 'Destination',
      detailView: 'receipt-detail',
    },
    delivery: {
      title: 'Delivery Orders',
      subtitle: 'Manage outgoing orders dispatched to customers.',
      newBtn: 'New Delivery Order',
      partnerLabel: 'Customer',
      locLabel: 'Source Location',
      detailView: 'delivery-detail',
    },
    transfer: {
      title: 'Internal Transfers',
      subtitle: 'Move inventory between internal warehouse locations and production racks.',
      newBtn: 'New Internal Transfer',
      locLabel: 'Route (From → To)',
      detailView: 'transfer-detail',
    },
    adjustment: {
      title: 'Stock Adjustments',
      subtitle: 'Reconcile recorded system stock against physical count differences.',
      newBtn: 'New Stock Adjustment',
      locLabel: 'Adjusted Location',
      detailView: 'adjustment-detail',
    },
  };

  const config = configMap[type] || configMap.receipt;

  const loadOperations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.getOperations(`?${params.toString()}`);
      setOperations(res.data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load operations.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperations();
  }, [type, search, statusFilter]);

  const handleCreateNew = async () => {
    try {
      // Fetch default locations & partners
      const [locRes, partnerRes] = await Promise.all([
        api.getLocations(),
        api.getPartners(`?type=${type === 'receipt' ? 'vendor' : 'customer'}`),
      ]);

      const locs = locRes.data;
      const partners = partnerRes.data;

      const newPayload = {
        type,
        partner_id: partners.length > 0 ? partners[0].id : null,
        source_location_id: type === 'delivery' || type === 'transfer' || type === 'adjustment' ? locs[0]?.id : null,
        dest_location_id: type === 'receipt' || type === 'transfer' ? (locs[1]?.id || locs[0]?.id) : null,
        scheduled_date: new Date().toISOString().slice(0, 10),
        lines: [],
      };

      const res = await api.createOperation(newPayload);
      setToast({ type: 'success', message: `${res.data.reference} created as draft.` });
      setSelectedDocId(res.data.id);
      setView(config.detailView);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to create operation.' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{config.title}</h1>
          <p className="page-subtitle">{config.subtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          <Plus size={16} />
          {config.newBtn}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px',
          padding: '14px 18px',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
          <input
            className="input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search by reference or contact name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['', 'Draft', 'Waiting', 'Ready', 'Done', 'Canceled'].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(st)}
            >
              {st || 'All Statuses'}
            </button>
          ))}
        </div>
      </div>

      {/* Operations Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              {config.partnerLabel && <th>{config.partnerLabel}</th>}
              <th>{config.locLabel}</th>
              <th>Scheduled Date</th>
              <th>Items</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading {config.title.toLowerCase()}...
                </td>
              </tr>
            ) : operations.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No {config.title.toLowerCase()} found matching your filters.
                </td>
              </tr>
            ) : (
              operations.map((op) => (
                <tr
                  key={op.id}
                  className="clickable-row"
                  onClick={() => {
                    setSelectedDocId(op.id);
                    setView(config.detailView);
                  }}
                >
                  <td className="mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                    {op.reference}
                  </td>
                  {config.partnerLabel && <td>{op.partner_name || '—'}</td>}
                  <td>
                    {type === 'transfer' ? (
                      <span className="mono" style={{ fontSize: '12.5px' }}>
                        {op.source_location_code} → {op.dest_location_code}
                      </span>
                    ) : (
                      <span className="mono" style={{ fontSize: '12.5px' }}>
                        {op.dest_location_code || op.source_location_code || '—'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Calendar size={13} />
                      {op.scheduled_date ? new Date(op.scheduled_date).toLocaleDateString() : '—'}
                    </div>
                  </td>
                  <td>{op.total_items} items</td>
                  <td>
                    <StatusBadge status={op.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
