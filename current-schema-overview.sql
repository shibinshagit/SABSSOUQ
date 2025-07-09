-- CORE BUSINESS TABLES
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  total_amount DECIMAL(12,2),
  status VARCHAR(50),
  sale_date TIMESTAMP,
  device_id INTEGER,
  payment_method VARCHAR(50),
  discount DECIMAL(12,2),
  received_amount DECIMAL(12,2),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id),
  product_id INTEGER,
  quantity INTEGER,
  price DECIMAL(10,2)
);

-- NEW INTEGRATED ACCOUNTING TABLE
CREATE TABLE financial_transactions (
  id SERIAL PRIMARY KEY,
  transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
  transaction_type VARCHAR(50) NOT NULL,  -- 'sale', 'purchase', 'adjustment'
  reference_type VARCHAR(50) NOT NULL,    -- 'sale', 'purchase'
  reference_id INTEGER NOT NULL,          -- links to sales.id or purchases.id
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  device_id INTEGER NOT NULL,
  company_id INTEGER DEFAULT 1,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- LEGACY FINANCE TABLES (still exist, separate system)
CREATE TABLE financial_ledger (...);
CREATE TABLE expense_categories (...);
CREATE TABLE income_categories (...);
CREATE TABLE budgets (...);
