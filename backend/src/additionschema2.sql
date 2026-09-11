-- Add driver details and billing target info to spare estimates
ALTER TABLE spare_estimates
  ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bill_to_customer_id INTEGER REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS bill_to_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bill_to_kra_pin VARCHAR(50);

-- Add driver details and billing target info to spare invoices
ALTER TABLE spare_invoices
  ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bill_to_customer_id INTEGER REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS bill_to_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bill_to_kra_pin VARCHAR(50);