-- StockSense Inventory Management System Database Schema
-- Production-Ready PostgreSQL with Strict Constraints, FKs, and Targeted Indexes

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (char_length(trim(name)) >= 2),
    email VARCHAR(150) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'manager' CHECK (role IN ('manager', 'staff', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Password Resets Table (Using user_id FK & Hashed OTP)
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (char_length(trim(name)) >= 2),
    code VARCHAR(20) UNIQUE NOT NULL CHECK (char_length(trim(code)) >= 1),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Partners Table (Vendors and Customers)
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL CHECK (char_length(trim(name)) >= 2),
    type VARCHAR(20) NOT NULL CHECK (type IN ('vendor', 'customer')),
    email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL CHECK (char_length(trim(name)) >= 2),
    sku VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(trim(sku)) >= 2),
    category VARCHAR(100) NOT NULL,
    uom VARCHAR(30) NOT NULL DEFAULT 'unit',
    reorder_point NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Live Stock Levels (Zero negative quantity constraint)
CREATE TABLE IF NOT EXISTS stock_levels (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    UNIQUE(product_id, location_id)
);

-- 8. Operations Table (Receipts, Deliveries, Transfers, Adjustments)
CREATE TABLE IF NOT EXISTS operations (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('receipt', 'delivery', 'transfer', 'adjustment')),
    reference VARCHAR(50) UNIQUE NOT NULL,
    partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
    source_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    dest_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    scheduled_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Waiting', 'Ready', 'Done', 'Canceled')),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Operation Lines Table
CREATE TABLE IF NOT EXISTS operation_lines (
    id SERIAL PRIMARY KEY,
    operation_id INTEGER NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    counted_quantity NUMERIC(12,2) CHECK (counted_quantity IS NULL OR counted_quantity >= 0)
);

-- 10. Immutable Stock Movement Ledger (Strict product_id FK)
CREATE TABLE IF NOT EXISTS stock_moves (
    id SERIAL PRIMARY KEY,
    operation_id INTEGER REFERENCES operations(id) ON DELETE SET NULL,
    reference VARCHAR(50) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    operation_type VARCHAR(30) NOT NULL,
    from_location VARCHAR(100) NOT NULL,
    to_location VARCHAR(100) NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Done' CHECK (status IN ('Done', 'Canceled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Targeted Composite & B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_stock_levels_lookup ON stock_levels(location_id, product_id);
CREATE INDEX IF NOT EXISTS idx_operations_type_status_date ON operations(type, status, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_operations_ref ON operations(reference);
CREATE INDEX IF NOT EXISTS idx_stock_moves_product_date ON stock_moves(product_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_moves_ref ON stock_moves(reference);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_active ON password_resets(user_id, used, expires_at);
