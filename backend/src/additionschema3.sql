BEGIN;

-- 1. Core Reference Tables
CREATE TABLE IF NOT EXISTS consignors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  contact_person VARCHAR(150),
  phone VARCHAR(50),
  email VARCHAR(150),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO consignors (name) VALUES
  ('Rift Motors Ltd'), ('Nissan Kenya'), ('Subaru Kenya'), ('Ford Kenya'), ('GWM Kenya')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS document_sequences (
  doc_type VARCHAR(30) PRIMARY KEY,
  prefix VARCHAR(20) NOT NULL,
  last_number INT NOT NULL DEFAULT 0
);

INSERT INTO document_sequences (doc_type, prefix, last_number)
VALUES 
  ('sales_quote', 'RML/Q/', 1174),
  ('sales_invoice', 'RML/INV/', 0),
  ('delivery_note', 'RML/DN/', 0)
ON CONFLICT (doc_type) DO NOTHING;

-- 2. Sales & Delivery Tables
CREATE TABLE IF NOT EXISTS sales_quotes (
  id SERIAL PRIMARY KEY,
  quote_ref VARCHAR(50) UNIQUE NOT NULL,
  vehicle_id INT NOT NULL REFERENCES vehicles(id),
  customer_id INT NOT NULL REFERENCES customers(id),
  quoted_price NUMERIC(12,2) NOT NULL,
  trade_in_reg_no VARCHAR(50),
  trade_in_amount NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  registration_fee NUMERIC(12,2) DEFAULT 0,
  valid_until DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','cancelled')),
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_quote_items (
  id SERIAL PRIMARY KEY,
  quote_id INT NOT NULL REFERENCES sales_quotes(id) ON DELETE CASCADE,
  item_name VARCHAR(150) NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sales_invoices (
  id SERIAL PRIMARY KEY,
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  quote_id INT REFERENCES sales_quotes(id),
  vehicle_id INT NOT NULL REFERENCES vehicles(id),
  customer_id INT NOT NULL REFERENCES customers(id),
  sale_price NUMERIC(12,2) NOT NULL,
  trade_in_amount NUMERIC(12,2) DEFAULT 0,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  registration_fee NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid')),
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  item_name VARCHAR(150) NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS delivery_notes (
  id SERIAL PRIMARY KEY,
  note_no VARCHAR(50) UNIQUE,
  invoice_id INT NOT NULL REFERENCES sales_invoices(id),
  delivered_by VARCHAR(150),
  received_by VARCHAR(150),
  mileage_on_delivery INT,
  delivery_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_note_items (
  id SERIAL PRIMARY KEY,
  delivery_note_id INT NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
  item_name VARCHAR(100) NOT NULL,
  quantity INT DEFAULT 1,
  is_checked BOOLEAN DEFAULT false
);

-- 3. Supplier Invoicing & Payments
CREATE SEQUENCE IF NOT EXISTS supplier_invoice_seq;

CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS text AS $$
  SELECT 'INV-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
         lpad(nextval('supplier_invoice_seq')::text, 5, '0');
$$ LANGUAGE sql;

CREATE TABLE IF NOT EXISTS supplier_invoices (
  id SERIAL PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  supplier_invoice_number TEXT,
  purchase_id INTEGER REFERENCES spare_purchases(id),
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 16,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','partially_paid','paid','cancelled')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  purchase_item_id INTEGER REFERENCES spare_purchase_items(id),
  sparepart_id INTEGER NOT NULL REFERENCES spareparts(id),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS supplier_payments (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_payment_allocations (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES supplier_payments(id) ON DELETE CASCADE,
  invoice_id INTEGER NOT NULL REFERENCES supplier_invoices(id),
  amount_allocated NUMERIC NOT NULL
);

-- 4. Vehicles & Images Enhancements
CREATE TABLE IF NOT EXISTS vehicle_images (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS condition VARCHAR(10) DEFAULT 'used' CHECK (condition IN ('new','used')),
  ADD COLUMN IF NOT EXISTS chassis_no VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS engine_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS registration_no VARCHAR(50),
  ADD COLUMN IF NOT EXISTS model_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS duty_free_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS duty_paid_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS consignor_id INT REFERENCES consignors(id),
  ADD COLUMN IF NOT EXISTS engine_rating VARCHAR(150),
  ADD COLUMN IF NOT EXISTS max_power VARCHAR(100),
  ADD COLUMN IF NOT EXISTS max_torque VARCHAR(100),
  ADD COLUMN IF NOT EXISTS braking VARCHAR(150),
  ADD COLUMN IF NOT EXISTS seating_capacity VARCHAR(50),
  ADD COLUMN IF NOT EXISTS fuel_tank_litres NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS suspension VARCHAR(200),
  ADD COLUMN IF NOT EXISTS tyre_size VARCHAR(50),
  ADD COLUMN IF NOT EXISTS warranty_text VARCHAR(200),
  ADD COLUMN IF NOT EXISTS free_service_text VARCHAR(200),
  ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 1;

-- 5. Spare Parts & Quantity Adjustments
ALTER TABLE spare_purchase_items 
  ADD COLUMN IF NOT EXISTS quantity_invoiced NUMERIC NOT NULL DEFAULT 0,
  ALTER COLUMN quantity TYPE NUMERIC(12,2),
  ALTER COLUMN quantity_received TYPE NUMERIC(12,2);

ALTER TABLE purchase_receipt_items 
  ALTER COLUMN quantity_received TYPE NUMERIC(12,2);

ALTER TABLE spareparts 
  ALTER COLUMN quantity TYPE NUMERIC(12,2);

-- 6. Permissions and Role Allocations
INSERT INTO permissions(name, module, description) VALUES
  ('sales.quotes.view','sales','View sales quotes/proformas'),
  ('sales.quotes.create','sales','Create sales quotes/proformas'),
  ('sales.quotes.cancel','sales','Cancel sales quotes'),
  ('sales.invoices.view','sales','View sales invoices'),
  ('sales.invoices.create','sales','Create sales invoices (convert quote to sale)'),
  ('sales.invoices.payment','sales','Update invoice payment status'),
  ('sales.delivery.view','sales','View delivery notes'),
  ('sales.delivery.create','sales','Create delivery notes'),
  ('vehicles.images.manage','vehicles','Upload/delete/reorder vehicle images'),
  ('consignors.view','consignors','View consignors'),
  ('consignors.create','consignors','Add consignors'),
  ('consignors.edit','consignors','Edit consignors'),
  ('consignors.delete','consignors','Delete consignors')
ON CONFLICT (name) DO NOTHING;

-- Boss & Admin
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Boss','admin')
AND (
  p.name IN (
    'sales.quotes.view','sales.quotes.create','sales.quotes.cancel',
    'sales.invoices.view','sales.invoices.create','sales.invoices.payment',
    'sales.delivery.view','sales.delivery.create',
    'vehicles.images.manage'
  ) OR p.module = 'consignors'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager & Sales Manager
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON TRUE
WHERE r.name IN ('Manager','Sales Manager')
AND (
  p.name IN (
    'sales.quotes.view','sales.quotes.create','sales.quotes.cancel',
    'sales.invoices.view','sales.invoices.create',
    'sales.delivery.view','sales.delivery.create',
    'vehicles.images.manage'
  ) OR p.module = 'consignors'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Accountant
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON TRUE
WHERE r.name = 'Accountant'
AND p.name IN (
  'sales.quotes.view',
  'sales.invoices.view','sales.invoices.payment',
  'sales.delivery.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;