-- Services table schema
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  device_id INTEGER NOT NULL,
  company_id INTEGER DEFAULT 1,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Service items table for sales
CREATE TABLE IF NOT EXISTS service_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_services_device_id ON services(device_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_service_items_sale_id ON service_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_service_items_service_id ON service_items(service_id);

-- Add sale_type column to sales table to distinguish between product sales and service sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) DEFAULT 'product';
