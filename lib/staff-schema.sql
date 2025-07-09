-- Staff table schema
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  position VARCHAR(100) NOT NULL,
  salary DECIMAL(10,2) NOT NULL,
  salary_date DATE NOT NULL,
  joined_on DATE NOT NULL,
  age INTEGER,
  id_card_number VARCHAR(100),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  device_id INTEGER NOT NULL,
  company_id INTEGER DEFAULT 1,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_staff_device_id ON staff(device_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_position ON staff(position);

-- Add staff_id to service_items table
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS staff_id INTEGER;
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS service_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS include_cost_in_invoice BOOLEAN DEFAULT false;

-- Add foreign key constraint for staff
-- ALTER TABLE service_items ADD CONSTRAINT fk_service_items_staff FOREIGN KEY (staff_id) REFERENCES staff(id);
