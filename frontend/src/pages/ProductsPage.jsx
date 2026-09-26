import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { Plus, Search, AlertTriangle, Edit2, Trash2, Package } from 'lucide-react';

export default function ProductsPage({ setToast }) {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    uom: 'unit',
    reorder_point: 10,
    initial_stock: [],
    stock_by_location: [],
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);

      const [pRes, locRes] = await Promise.all([
        api.getProducts(`?${params.toString()}`),
        api.getLocations(),
      ]);
      setProducts(pRes.data);
      setLocations(locRes.data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch products.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, categoryFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: '',
      uom: 'unit',
      reorder_point: 10,
      initial_stock: locations.map((l) => ({ location_id: l.id, location_code: l.code, quantity: 0 })),
      stock_by_location: [],
    });
    setModalOpen(true);
  };

  const openEditModal = async (product) => {
    try {
      const detailRes = await api.getProduct(product.id);
      const prod = detailRes.data;
      setEditingProduct(prod);
      setFormData({
        name: prod.name,
        sku: prod.sku,
        category: prod.category,
        uom: prod.uom,
        reorder_point: prod.reorder_point,
        initial_stock: [],
        stock_by_location: prod.stock_by_location.map((s) => ({
          location_id: s.location_id,
          location_code: s.location_code,
          quantity: s.quantity,
        })),
      });
      setModalOpen(true);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load product details.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          uom: formData.uom,
          reorder_point: formData.reorder_point,
          stock_by_location: formData.stock_by_location,
        });
        setToast({ type: 'success', message: `Product "${formData.name}" updated successfully.` });
      } else {
        await api.createProduct({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          uom: formData.uom,
          reorder_point: formData.reorder_point,
          initial_stock: formData.initial_stock,
        });
        setToast({ type: 'success', message: `Product "${formData.name}" created successfully.` });
      }
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Operation failed.' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      setToast({ type: 'success', message: `Product "${name}" deleted.` });
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Cannot delete product.' });
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Track stock availability and reordering rules across all locations.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          New Product
        </button>
      </div>

      {/* Search and Filters */}
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
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: '180px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product / SKU</th>
              <th>Category</th>
              <th>UoM</th>
              <th>On Hand</th>
              <th>Free to Use</th>
              <th>Reorder Point</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading product catalog...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No products found. Click "+ New Product" to create one.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr
                  key={p.id}
                  className="clickable-row"
                  onClick={() => openEditModal(p)}
                >
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                    <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {p.sku}
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <span className="badge badge-draft" style={{ textTransform: 'lowercase' }}>
                      {p.uom}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14.5px' }}>{p.on_hand}</span>
                      {p.is_low_stock && (
                        <span className="badge badge-waiting" style={{ gap: '4px' }}>
                          <AlertTriangle size={11} /> Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: p.free_to_use > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                      {p.free_to_use}
                    </span>
                  </td>
                  <td>
                    <span className="mono" style={{ color: 'var(--text-muted)' }}>
                      {p.reorder_point}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openEditModal(p)}
                      title="Edit Product"
                    >
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Product Modal (Create & Edit) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? `Edit ${editingProduct.name}` : 'New Product'}
        maxWidth="560px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              className="input"
              placeholder="e.g. Steel Rods"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>SKU / Internal Code</label>
              <input
                className="input mono"
                placeholder="e.g. STL-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                className="input"
                placeholder="e.g. Raw Material"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Unit of Measure (UoM)</label>
              <input
                className="input"
                placeholder="unit, kg, m, etc."
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Reorder Point (Min Threshold)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
              />
            </div>
          </div>

          {/* Stock by Location */}
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Stock Availability by Location
            </label>

            {editingProduct ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.stock_by_location.map((s, idx) => (
                  <div key={s.location_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '13px' }}>{s.location_code}</span>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      style={{ width: '110px', padding: '6px 10px' }}
                      value={s.quantity}
                      onChange={(e) => {
                        const updated = [...formData.stock_by_location];
                        updated[idx].quantity = e.target.value;
                        setFormData({ ...formData, stock_by_location: updated });
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Optionally enter initial starting inventory:
                </p>
                {formData.initial_stock.map((s, idx) => (
                  <div key={s.location_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '13px' }}>{s.location_code}</span>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      style={{ width: '110px', padding: '6px 10px' }}
                      value={s.quantity}
                      onChange={(e) => {
                        const updated = [...formData.initial_stock];
                        updated[idx].quantity = e.target.value;
                        setFormData({ ...formData, initial_stock: updated });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
            </div>

            {editingProduct && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDelete(editingProduct.id, editingProduct.name)}
              >
                <Trash2 size={15} />
                Delete
              </button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
