-- =====================================================
-- Database Schema untuk Aplikasi Distribusi Bahan Ajar
-- =====================================================

-- 1. ROLES TABLE (Gudang, Mahasiswa, Admin)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('gudang', 'Warehouse manager - mengelola stok dan pengiriman'),
('mahasiswa', 'Student - melakukan pemesanan bahan ajar'),
('admin', 'Admin Operasional - mengelola sistem dan approval pembayaran')
ON CONFLICT DO NOTHING;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    address TEXT,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);

-- 3. PRODUCTS TABLE (Master Bahan Ajar)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100),
    unit_price DECIMAL(10, 2) NOT NULL,
    unit_type VARCHAR(50) DEFAULT 'pcs',
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_is_active ON products(is_active);

-- 4. STOCK TABLE (Stok Barang - Stok Onhand, Stok Pemesan, Stock Akhir)
CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    stock_onhand INTEGER DEFAULT 0,
    stock_order INTEGER DEFAULT 0,
    stock_akhir INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- Create index
CREATE INDEX idx_stock_product_id ON stock(product_id);

-- 5. ORDERS TABLE (Pesanan Mahasiswa)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- pending, payment_submitted, payment_approved, shipped, received, cancelled
    total_amount DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    expected_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- 6. ORDER ITEMS TABLE (Detail Item dalam Pesanan)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 7. PAYMENT APPROVAL TABLE (Approval Pembayaran berdasarkan dokumen upload)
CREATE TABLE IF NOT EXISTS payment_approvals (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    document_file_path VARCHAR(500) NOT NULL,
    document_type VARCHAR(50) DEFAULT 'transfer_proof', -- transfer_proof, invoice, receipt
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    approval_by INTEGER REFERENCES users(id),
    approval_date TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_payment_approvals_order_id ON payment_approvals(order_id);
CREATE INDEX idx_payment_approvals_user_id ON payment_approvals(user_id);
CREATE INDEX idx_payment_approvals_status ON payment_approvals(status);

-- 8. STOCK MOVEMENTS TABLE (Tracking pergerakan stok)
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    order_id INTEGER REFERENCES orders(id),
    movement_type VARCHAR(50) NOT NULL, -- order, shipment, return, adjustment
    quantity_change INTEGER NOT NULL,
    notes TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_order_id ON stock_movements(order_id);

-- =====================================================
-- VIEWS untuk reporting dan dashboard
-- =====================================================

-- View: Stok Summary
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT 
    p.id,
    p.code,
    p.name,
    p.category,
    p.unit_price,
    s.stock_onhand,
    s.stock_order,
    s.stock_akhir,
    p.is_active
FROM products p
LEFT JOIN stock s ON p.id = s.product_id;

-- View: Order Summary dengan User dan Total Items
CREATE OR REPLACE VIEW v_order_summary AS
SELECT 
    o.id,
    o.order_number,
    u.full_name,
    u.email,
    o.order_date,
    o.status,
    o.total_amount,
    COUNT(oi.id) as item_count
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, u.full_name, u.email, o.order_date, o.status, o.total_amount;

-- View: Pending Payment Approvals
CREATE OR REPLACE VIEW v_pending_payments AS
SELECT 
    pa.id,
    o.order_number,
    u.full_name,
    u.email,
    o.total_amount,
    pa.upload_date,
    pa.document_type,
    pa.status
FROM payment_approvals pa
JOIN orders o ON pa.order_id = o.id
JOIN users u ON pa.user_id = u.id
WHERE pa.status = 'pending'
ORDER BY pa.upload_date ASC;

-- =====================================================
-- Constraints & Triggers
-- =====================================================

-- Update updated_at timestamp automatically for users table
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- Update updated_at timestamp automatically for products table
CREATE OR REPLACE FUNCTION update_products_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_products_timestamp();

-- Update updated_at timestamp automatically for orders table
CREATE OR REPLACE FUNCTION update_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_timestamp();

-- Update updated_at timestamp automatically for payment_approvals table
CREATE OR REPLACE FUNCTION update_payment_approvals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_approvals_updated_at
BEFORE UPDATE ON payment_approvals
FOR EACH ROW
EXECUTE FUNCTION update_payment_approvals_timestamp();

-- =====================================================
-- Sample Data untuk Testing
-- =====================================================

-- Sample Users
INSERT INTO users (email, password, full_name, phone_number, role_id) VALUES
('gudang@example.com', '$2b$10$iWiPC6CMMcbDKBa1cV2KVOo0QVOl8cTug3F5RDST4iomr2Z.Ryf.2', 'Budi Santoso', '081234567890', 1),
('admin@example.com', '$2b$10$iWiPC6CMMcbDKBa1cV2KVOo0QVOl8cTug3F5RDST4iomr2Z.Ryf.2', 'Admin System', '081234567891', 3),
('mahasiswa1@example.com', '$2b$10$iWiPC6CMMcbDKBa1cV2KVOo0QVOl8cTug3F5RDST4iomr2Z.Ryf.2', 'Andi Wijaya', '081234567892', 2),
('mahasiswa2@example.com', '$2b$10$iWiPC6CMMcbDKBa1cV2KVOo0QVOl8cTug3F5RDST4iomr2Z.Ryf.2', 'Siti Nurhaliza', '081234567893', 2)
ON CONFLICT DO NOTHING;

-- Sample Products
INSERT INTO products (name, code, category, unit_price, unit_type, description, is_active, created_by) VALUES
('Buku Algoritma & Struktur Data', 'BUKU001', 'Buku', 150000.00, 'pcs', 'Buku panduan lengkap algoritma dan struktur data', TRUE, 2),
('Modul Database Design', 'MOD001', 'Modul', 75000.00, 'pcs', 'Modul pembelajaran database design', TRUE, 2),
('Catatan Kuliah Web Development', 'CAT001', 'Catatan', 50000.00, 'set', 'Catatan lengkap web development', TRUE, 2),
('Soal Latihan Pemrograman', 'SOAL001', 'Soal', 45000.00, 'pcs', 'Kumpulan soal latihan pemrograman', TRUE, 2)
ON CONFLICT DO NOTHING;

-- Sample Stock (akan diupdate oleh user)
INSERT INTO stock (product_id, stock_onhand, stock_order, stock_akhir, updated_by)
SELECT id, 100, 0, 100, 1 FROM products
ON CONFLICT DO NOTHING;
