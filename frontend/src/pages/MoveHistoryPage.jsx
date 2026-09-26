import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { Search, Calendar, RefreshCw } from 'lucide-react';

export default function MoveHistoryPage({ setToast }) {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadMoves = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);

      const res = await api.getMoveHistory(`?${params.toString()}`);
      setMoves(res.data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch stock moves.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMoves();
  }, [search, typeFilter]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Move History</h1>
          <p className="page-subtitle">Immutable double-entry stock ledger tracking all warehouse movements.</p>
        </div>
        <button className="btn btn-ghost" onClick={loadMoves} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
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
            placeholder="Search by reference, product, from/to location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: '190px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Movement Types</option>
          <option value="Receipt">Receipts</option>
          <option value="Delivery Order">Delivery Orders</option>
          <option value="Internal Transfer">Internal Transfers</option>
          <option value="Adjustment">Adjustments</option>
          <option value="Initial Inventory">Initial Inventory</option>
        </select>
      </div>

      {/* Stock Ledger Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Date</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading ledger entries...
                </td>
              </tr>
            ) : moves.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No stock moves recorded yet. Complete an operation to populate the ledger.
                </td>
              </tr>
            ) : (
              moves.map((m) => {
                const qty = parseFloat(m.quantity);
                const isPositive = qty > 0;

                return (
                  <tr key={m.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>{m.reference}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <Calendar size={13} />
                        {m.date ? new Date(m.date).toLocaleDateString() : '—'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-draft">{m.operation_type}</span>
                    </td>
                    <td className="mono" style={{ fontSize: '12.5px' }}>{m.from_location}</td>
                    <td className="mono" style={{ fontSize: '12.5px' }}>{m.to_location}</td>
                    <td>
                      <strong>{m.product_name}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: isPositive ? 'var(--green)' : 'var(--red)',
                        }}
                      >
                        {isPositive ? `+${qty}` : qty}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={m.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
