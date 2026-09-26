-- =========================================================================
-- StockSense IMS - Supabase Database Schema & Initial Data
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    address TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Locations / Racks Table
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    warehouse_id TEXT REFERENCES warehouses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('internal', 'vendor', 'customer', 'inventory_loss', 'production')),
    rack_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Product Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    barcode TEXT,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    uom TEXT NOT NULL DEFAULT 'Units',
    cost_price NUMERIC(12, 2) DEFAULT 0.00,
    selling_price NUMERIC(12, 2) DEFAULT 0.00,
    min_stock_alert NUMERIC(12, 2) DEFAULT 10,
    reorder_quantity NUMERIC(12, 2) DEFAULT 50,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Stock Levels per Location
CREATE TABLE IF NOT EXISTS stock_levels (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    location_id TEXT REFERENCES locations(id) ON DELETE CASCADE,
    warehouse_id TEXT REFERENCES warehouses(id) ON DELETE SET NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, location_id)
);

-- 6. Operations (Receipts, Deliveries, Transfers, Adjustments)
CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    reference TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('receipt', 'delivery', 'internal', 'adjustment')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'waiting', 'ready', 'done', 'canceled')),
    partner_name TEXT,
    source_location_id TEXT REFERENCES locations(id),
    dest_location_id TEXT REFERENCES locations(id),
    warehouse_id TEXT REFERENCES warehouses(id),
    scheduled_date TIMESTAMPTZ DEFAULT NOW(),
    completed_date TIMESTAMPTZ,
    notes TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT NOT NULL DEFAULT 'Inventory User',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    adjustment_reason TEXT
);

-- 7. Double-Entry Stock Ledger (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS stock_ledger (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    reference TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    from_location_id TEXT,
    from_location_name TEXT NOT NULL,
    to_location_id TEXT,
    to_location_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    uom TEXT NOT NULL,
    "user" TEXT NOT NULL DEFAULT 'System',
    reason TEXT
);

-- =========================================================================
-- Enable Row Level Security (RLS) with full public access policies for anon
-- =========================================================================
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to warehouses" ON warehouses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to locations" ON locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to stock_levels" ON stock_levels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to operations" ON operations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to stock_ledger" ON stock_ledger FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- Seed Data matching StockSense.pdf specifications
-- =========================================================================

-- Warehouses
INSERT INTO warehouses (id, name, code, address, is_default) VALUES
('wh-1', 'Main Central Warehouse', 'WH-CENTRAL', '742 Evergreen Logistics Blvd, Sector 4', true),
('wh-2', 'East Coast Assembly Plant', 'WH-EAST', '109 Harbour Industrial Hub, Dock 3', false)
ON CONFLICT (code) DO NOTHING;

-- Locations
INSERT INTO locations (id, warehouse_id, name, code, type, rack_number) VALUES
('loc-vendor', NULL, 'Partners / Vendors', 'PARTNERS/VENDORS', 'vendor', NULL),
('loc-customer', NULL, 'Partners / Customers', 'PARTNERS/CUSTOMERS', 'customer', NULL),
('loc-loss', NULL, 'Virtual / Inventory Loss', 'VIRTUAL/SCRAP', 'inventory_loss', NULL),
('loc-wh1-stock', 'wh-1', 'Main Store / Stock', 'WH1/STOCK', 'internal', 'A-01'),
('loc-wh1-rack-a', 'wh-1', 'Main Warehouse / Rack A', 'WH1/RACK-A', 'internal', 'A-12'),
('loc-wh1-rack-b', 'wh-1', 'Main Warehouse / Rack B', 'WH1/RACK-B', 'internal', 'B-04'),
('loc-wh1-output', 'wh-1', 'Main Warehouse / Dispatch Dock', 'WH1/OUTPUT', 'internal', 'DOCK-1'),
('loc-wh1-prod', 'wh-1', 'Main Facility / Production Floor', 'WH1/PROD-FLOOR', 'production', 'PROD-01'),
('loc-wh2-stock', 'wh-2', 'East Assembly / Stock', 'WH2/STOCK', 'internal', 'E-01'),
('loc-wh2-rack-c', 'wh-2', 'East Assembly / Rack C', 'WH2/RACK-C', 'internal', 'C-09')
ON CONFLICT (code) DO NOTHING;

-- Categories
INSERT INTO categories (id, name, description, color) VALUES
('cat-1', 'Raw Materials', 'Metals, plastics and base processing stock', '#3b82f6'),
('cat-2', 'Furniture & Seating', 'Office desks, ergonomic chairs and storage', '#10b981'),
('cat-3', 'Finished Goods', 'Assembled products ready for commercial sale', '#8b5cf6'),
('cat-4', 'Machinery & Parts', 'Replacement parts, cylinders and hydraulic units', '#f59e0b')
ON CONFLICT (name) DO NOTHING;

-- Products
INSERT INTO products (id, name, sku, category_id, uom, cost_price, selling_price, min_stock_alert, reorder_quantity, description) VALUES
('prod-1', 'Steel Rods (High Tensile)', 'STL-ROD-01', 'cat-1', 'kg', 2.40, 4.80, 50, 200, 'Cold rolled industrial grade high tensile steel rods for framing.'),
('prod-2', 'Ergonomic Executive Mesh Chair', 'CHR-ERGO-02', 'cat-2', 'Units', 65.00, 149.00, 15, 50, 'Breathable lumbar support chair with 4D adjustable armrests.'),
('prod-3', 'Heavy-Duty Modular Steel Frame', 'STL-FRM-03', 'cat-3', 'Units', 120.00, 260.00, 20, 60, 'Prefabricated steel warehouse storage frames.'),
('prod-4', 'Aluminum Anodized Sheets 4mm', 'ALU-SHT-04', 'cat-1', 'Units', 38.00, 75.00, 25, 100, 'Corrosion-resistant anodized aluminum surface sheeting.'),
('prod-5', 'Hydraulic Actuator Cylinder 50T', 'HYD-CYL-05', 'cat-4', 'Units', 320.00, 680.00, 10, 25, 'High pressure 50-ton hydraulic compression cylinder.')
ON CONFLICT (sku) DO NOTHING;

-- Stock Levels
INSERT INTO stock_levels (id, product_id, location_id, warehouse_id, quantity) VALUES
('sl-1', 'prod-1', 'loc-wh1-stock', 'wh-1', 47),
('sl-2', 'prod-1', 'loc-wh1-prod', 'wh-1', 47),
('sl-3', 'prod-1', 'loc-wh2-stock', 'wh-2', 30),
('sl-4', 'prod-2', 'loc-wh1-rack-a', 'wh-1', 32),
('sl-5', 'prod-2', 'loc-wh2-stock', 'wh-2', 10),
('sl-6', 'prod-3', 'loc-wh1-stock', 'wh-1', 18),
('sl-7', 'prod-4', 'loc-wh1-rack-b', 'wh-1', 8),
('sl-8', 'prod-5', 'loc-wh1-stock', 'wh-1', 0)
ON CONFLICT (product_id, location_id) DO NOTHING;
