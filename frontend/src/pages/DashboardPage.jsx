import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { Package, AlertTriangle, ArrowDownLeft, ArrowUpRight, Repeat, ArrowRight, Filter, RefreshCw } from 'lucide-react';

export default function DashboardPage({ setView, setSelectedDocId, setToast }) {
  const [data, setData] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic filter states
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWarehouse) params.append('warehouseId', selectedWarehouse);
      if (selectedLocation) params.append('locationId', selectedLocation);
      if (selectedCategory) params.append('category', selectedCategory);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const [dashRes, whRes, locRes] = await Promise.all([
        api.getDashboard(queryStr),
        api.getWarehouses(),
        api.getLocations(),
      ]);

      setData(dashRes.data);
      setWarehouses(whRes.data);
      setLocations(locRes.data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load dashboard.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedWarehouse, selectedLocation, selectedCategory]);

  const kpis = data?.kpis || {
    totalProducts: 0,
    lowStockCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    scheduledTransfers: 0,
  };

  const filteredLocations = selectedWarehouse
    ? locations.filter((l) => l.warehouse_id === parseInt(selectedWarehouse, 10))
    : locations;

  return (
    <div>
      {/* Top Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time snapshot of warehouse operations & stock metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={loadDashboard} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Dynamic Filters Bar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          background: 'var(--panel)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
          <Filter size={15} />
          Filters:
        </div>

        {/* Warehouse Filter */}
        <select
          className="select"
          style={{ width: '190px', padding: '7px 10px', fontSize: '13px' }}
          value={selectedWarehouse}
          onChange={(e) => {
            setSelectedWarehouse(e.target.value);
            setSelectedLocation('');
          }}
        >
          <option value="">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.code})
            </option>
          ))}
        </select>

        {/* Location Filter */}
        <select
          className="select"
          style={{ width: '190px', padding: '7px 10px', fontSize: '13px' }}
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          {filteredLocations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code} ({l.name})
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          className="select"
          style={{ width: '190px', padding: '7px 10px', fontSize: '13px' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {data?.categories?.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {(selectedWarehouse || selectedLocation || selectedCategory) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSelectedWarehouse('');
              setSelectedLocation('');
              setSelectedCategory('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* Total Products */}
        <div
          className="card"
          style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
          onClick={() => setView('products')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Products</div>
            <Package size={18} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.02em' }}>
            {kpis.totalProducts}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Active SKUs in inventory</div>
        </div>

        {/* Low Stock / Out of Stock */}
        <div
          className="card"
          style={{
            borderColor: kpis.lowStockCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--border)',
            background: kpis.lowStockCount > 0 ? 'rgba(245, 158, 11, 0.04)' : 'var(--panel)',
            cursor: 'pointer',
          }}
          onClick={() => setView('products')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '13px', color: kpis.lowStockCount > 0 ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 500 }}>
              Low / Out of Stock
            </div>
            <AlertTriangle size={18} color={kpis.lowStockCount > 0 ? 'var(--accent)' : 'var(--text-muted)'} />
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              marginTop: '8px',
              color: kpis.lowStockCount > 0 ? 'var(--accent)' : 'var(--text)',
            }}
          >
            {kpis.lowStockCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {kpis.lowStockCount > 0 ? 'Action required: Reorder' : 'All items well stocked'}
          </div>
        </div>

        {/* Pending Receipts */}
        <div
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => setView('receipts')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Pending Receipts</div>
            <ArrowDownLeft size={18} color="var(--green)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--green)' }}>
            {kpis.pendingReceipts}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Incoming supplier orders</div>
        </div>

        {/* Pending Deliveries */}
        <div
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => setView('deliveries')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Pending Deliveries</div>
            <ArrowUpRight size={18} color="var(--blue)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--blue)' }}>
            {kpis.pendingDeliveries}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Outgoing customer orders</div>
        </div>

        {/* Scheduled Transfers */}
        <div
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => setView('transfers')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Internal Transfers</div>
            <Repeat size={18} color="var(--purple)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--purple)' }}>
            {kpis.scheduledTransfers}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Scheduled between racks</div>
        </div>
      </div>

      {/* Recent Activity Sections (Receipts & Deliveries) */}
      <div className="grid-2">
        {/* Recent Receipts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Receipts</h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Incoming shipments from suppliers</p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setView('receipts')}
            >
              View all <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Vendor</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentReceipts?.length > 0 ? (
                  data.recentReceipts.map((r) => (
                    <tr
                      key={r.id}
                      className="clickable-row"
                      onClick={() => {
                        setSelectedDocId(r.id);
                        setView('receipt-detail');
                      }}
                    >
                      <td className="mono" style={{ fontWeight: 600 }}>{r.reference}</td>
                      <td>{r.partner_name || 'Vendor'}</td>
                      <td className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.location_code}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No recent receipts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Delivery Orders</h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Outgoing dispatches to customers</p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setView('deliveries')}
            >
              View all <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentDeliveries?.length > 0 ? (
                  data.recentDeliveries.map((d) => (
                    <tr
                      key={d.id}
                      className="clickable-row"
                      onClick={() => {
                        setSelectedDocId(d.id);
                        setView('delivery-detail');
                      }}
                    >
                      <td className="mono" style={{ fontWeight: 600 }}>{d.reference}</td>
                      <td>{d.partner_name || 'Customer'}</td>
                      <td className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.location_code}</td>
                      <td><StatusBadge status={d.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No recent deliveries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
