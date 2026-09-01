ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS amount_credited NUMERIC DEFAULT 0;

CREATE TABLE IF NOT EXISTS service_credit_notes (
  id SERIAL PRIMARY KEY,
  credit_note_number VARCHAR(60) UNIQUE,
  invoice_id INTEGER REFERENCES service_invoices(id),
  job_id INTEGER REFERENCES service_jobs(id),
  customer_name VARCHAR(100),
  customer_phone VARCHAR(30),
  reason VARCHAR(255),
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status VARCHAR(30) DEFAULT 'issued',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_credit_note_items (
  id SERIAL PRIMARY KEY,
  credit_note_id INTEGER REFERENCES service_credit_notes(id) ON DELETE CASCADE,
  invoice_item_id INTEGER REFERENCES service_invoice_items(id),
  item_type VARCHAR(20),
  description VARCHAR(200),
  quantity INTEGER,
  unit_price NUMERIC,
  total_price NUMERIC
);

INSERT INTO permissions (name, module, description) 
VALUES ('services.creditnotes', 'services', 'Manage service credit notes')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Accountant' AND p.name = 'services.creditnotes'
ON CONFLICT DO NOTHING;