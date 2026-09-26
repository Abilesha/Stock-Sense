-- ==============================================================================
-- StockSense Seed Data SQL Template
-- ==============================================================================
-- Hey team! Use this script to load initial demo records during local setup.
-- You can add sample products, partner vendors, and sample warehouses here.
-- ==============================================================================

-- Seed Warehouses & Virtual Locations
INSERT INTO warehouses (name, code, location_type) VALUES
  ('Main Central Warehouse', 'WH-MAIN', 'internal'),
  ('Secondary Annex Store', 'WH-ANNEX', 'internal'),
  ('Supplier General Vendor', 'VEND-GEN', 'vendor'),
  ('Scrap & Inventory Adjustment', 'VIRT-ADJ', 'inventory')
ON CONFLICT (code) DO NOTHING;

-- Seed Sample SKU Catalog
INSERT INTO products (name, sku, category, unit, min_stock, cost_price) VALUES
  ('Steel Bearing 10mm', 'SKU-BRG-001', 'Hardware', 'PCS', 50, 4.50),
  ('Industrial Lubricant 5L', 'SKU-LUB-002', 'Chemicals', 'CAN', 20, 18.00),
  ('Rubber Gasket Seals', 'SKU-GSK-003', 'Hardware', 'PACK', 100, 2.25)
ON CONFLICT (sku) DO NOTHING;
