-- Add vehicle_id foreign keys to spare parts tables
ALTER TABLE spare_estimates ADD COLUMN IF NOT EXISTS vehicle_id INTEGER REFERENCES customer_vehicles(id);
ALTER TABLE spare_invoices  ADD COLUMN IF NOT EXISTS vehicle_id INTEGER REFERENCES customer_vehicles(id);
ALTER TABLE spare_sales     ADD COLUMN IF NOT EXISTS vehicle_id INTEGER REFERENCES customer_vehicles(id);

-- Insert new permissions for customer vehicles
INSERT INTO permissions (name, module, description) VALUES
('customervehicles.view','customervehicles','View customer vehicles'),
('customervehicles.create','customervehicles','Add customer vehicles'),
('customervehicles.edit','customervehicles','Edit customer vehicles'),
('customervehicles.delete','customervehicles','Delete customer vehicles')
ON CONFLICT (name) DO NOTHING;

-- Boss & Admin: full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Boss','admin') AND p.module='customervehicles'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager: full access to customer vehicles module
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name='Manager' AND p.module='customervehicles'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Service Advisor: full access to customer vehicles module
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name='Service Advisor' AND p.module='customervehicles'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Sales Manager: view-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name='customervehicles.view'
WHERE r.name='Sales Manager'
ON CONFLICT (role_id, permission_id) DO NOTHING;