import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { Plus, Warehouse, MapPin, Users, Edit2, ShieldCheck, UserCheck } from 'lucide-react';

export default function SettingsPage({ setToast }) {
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [whModalOpen, setWhModalOpen] = useState(false);
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);

  const [editingWh, setEditingWh] = useState(null);
  const [editingLoc, setEditingLoc] = useState(null);

  const [whForm, setWhForm] = useState({ name: '', code: '', address: '' });
  const [locForm, setLocForm] = useState({ warehouse_id: '', name: '', code: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'staff' });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [whRes, locRes, userRes] = await Promise.all([
        api.getWarehouses(),
        api.getLocations(),
        api.getUsers(),
      ]);
      setWarehouses(whRes.data);
      setLocations(locRes.data);
      setUsers(userRes.data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const openWhModal = (wh = null) => {
    setEditingWh(wh);
    setWhForm({
      name: wh ? wh.name : '',
      code: wh ? wh.code : '',
      address: wh ? wh.address || '' : '',
    });
    setWhModalOpen(true);
  };

  const handleWhSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWh) {
        await api.updateWarehouse(editingWh.id, whForm);
        setToast({ type: 'success', message: 'Warehouse updated.' });
      } else {
        await api.createWarehouse(whForm);
        setToast({ type: 'success', message: 'Warehouse created.' });
      }
      setWhModalOpen(false);
      loadSettings();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Warehouse action failed.' });
    }
  };

  const openLocModal = (loc = null) => {
    setEditingLoc(loc);
    setLocForm({
      warehouse_id: loc ? loc.warehouse_id : (warehouses[0]?.id || ''),
      name: loc ? loc.name : '',
      code: loc ? loc.code : '',
    });
    setLocModalOpen(true);
  };

  const handleLocSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLoc) {
        await api.updateLocation(editingLoc.id, locForm);
        setToast({ type: 'success', message: 'Location updated.' });
      } else {
        await api.createLocation(locForm);
        setToast({ type: 'success', message: 'Location created.' });
      }
      setLocModalOpen(false);
      loadSettings();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Location action failed.' });
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(userForm);
      setToast({ type: 'success', message: `Team member ${userForm.name} created as ${userForm.role}.` });
      setUserModalOpen(false);
      setUserForm({ name: '', email: '', password: '', role: 'staff' });
      loadSettings();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to create user.' });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      setToast({ type: 'success', message: 'Role updated successfully.' });
      loadSettings();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to change role.' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings & Organization</h1>
          <p className="page-subtitle">Configure team roles, multi-warehouse facilities, and stock storage locations.</p>
        </div>
      </div>

      {/* 1. Team & Role Management */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--accent)" />
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Team Roles & Access</h2>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              <strong>Inventory Managers:</strong> Manage incoming receipts & customer deliveries. <strong>Warehouse Staff:</strong> Perform internal transfers, shelving, picking & physical counting.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setUserModalOpen(true)}>
            <Plus size={14} /> Add Team Member
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role Assignment</th>
                <th>Responsibilities</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'manager' ? 'badge-ready' : 'badge-waiting'}`}>
                      {u.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {u.role === 'manager'
                      ? 'Receipts (In), Deliveries (Out), Products, Catalog'
                      : 'Internal Transfers, Shelving, Physical Stock Counting'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <select
                      className="select"
                      style={{ width: '150px', padding: '4px 8px', fontSize: '12.5px' }}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="manager">Inventory Manager</option>
                      <option value="staff">Warehouse Staff</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Warehouses Table */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warehouse size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Warehouses</h2>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openWhModal()}>
            <Plus size={14} /> New Warehouse
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Warehouse Name</th>
                <th>Short Code</th>
                <th>Address</th>
                <th>Total Locations</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id}>
                  <td><strong>{w.name}</strong></td>
                  <td className="mono">{w.code}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{w.address || '—'}</td>
                  <td>{w.total_locations} locations</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openWhModal(w)}>
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Locations Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="var(--blue)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Stock Locations</h2>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openLocModal()}>
            <Plus size={14} /> New Location
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Location Code</th>
                <th>Warehouse</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.name}</strong></td>
                  <td className="mono" style={{ color: 'var(--blue)' }}>{l.code}</td>
                  <td>{l.warehouse_name} ({l.warehouse_code})</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openLocModal(l)}>
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title="Add New Team Member"
      >
        <form onSubmit={handleUserSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              className="input"
              placeholder="e.g. Alex Morgan"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="input"
              placeholder="alex@company.com"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Temporary Password</label>
            <input
              type="password"
              className="input"
              placeholder="Min. 6 characters"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>Assigned Role</label>
            <select
              className="select"
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            >
              <option value="manager">Inventory Manager (Incoming & Outgoing Stock)</option>
              <option value="staff">Warehouse Staff (Transfers, Shelving & Counting)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary">
              Create Team Member
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setUserModalOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Warehouse Modal */}
      <Modal
        isOpen={whModalOpen}
        onClose={() => setWhModalOpen(false)}
        title={editingWh ? 'Edit Warehouse' : 'New Warehouse'}
      >
        <form onSubmit={handleWhSubmit}>
          <div className="form-group">
            <label>Warehouse Name</label>
            <input
              className="input"
              placeholder="e.g. Main Distribution Center"
              value={whForm.name}
              onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Short Code</label>
            <input
              className="input mono"
              placeholder="e.g. WH2"
              value={whForm.code}
              onChange={(e) => setWhForm({ ...whForm, code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Physical Address</label>
            <input
              className="input"
              placeholder="e.g. 45 Logistics Way"
              value={whForm.address}
              onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary">
              {editingWh ? 'Update Warehouse' : 'Save Warehouse'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setWhModalOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Location Modal */}
      <Modal
        isOpen={locModalOpen}
        onClose={() => setLocModalOpen(false)}
        title={editingLoc ? 'Edit Location' : 'New Location'}
      >
        <form onSubmit={handleLocSubmit}>
          <div className="form-group">
            <label>Warehouse</label>
            <select
              className="select"
              value={locForm.warehouse_id}
              onChange={(e) => setLocForm({ ...locForm, warehouse_id: parseInt(e.target.value, 10) })}
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Location Name</label>
            <input
              className="input"
              placeholder="e.g. Shelf A-01"
              value={locForm.name}
              onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Location Code (Internal Path)</label>
            <input
              className="input mono"
              placeholder="e.g. WH/Shelf-A"
              value={locForm.code}
              onChange={(e) => setLocForm({ ...locForm, code: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary">
              {editingLoc ? 'Update Location' : 'Save Location'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setLocModalOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
