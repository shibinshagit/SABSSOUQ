-- Financial Ledger - Main table for all financial transactions
CREATE TABLE IF NOT EXISTS financial_ledger (
  id SERIAL PRIMARY KEY,
  transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
  transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'purchase', 'payment_received', 'payment_made', 'return_sale', 'return_purchase', 'expense', 'income'
  reference_type VARCHAR(50), -- 'sale', 'purchase', 'manual', etc.
  reference_id INTEGER, -- ID in the respective table (sales, purchases, etc.)
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  account_type VARCHAR(50) NOT NULL, -- 'revenue', 'expense', 'asset', 'liability'
  debit_amount DECIMAL(12,2) DEFAULT 0,
  credit_amount DECIMAL(12,2) DEFAULT 0,
  device_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments table for tracking partial payments
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  reference_type VARCHAR(50) NOT NULL, -- 'sale' or 'purchase'
  reference_id INTEGER NOT NULL, -- sale_id or purchase_id
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'Cash',
  notes TEXT,
  device_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sale returns table
CREATE TABLE IF NOT EXISTS sale_returns (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  return_date TIMESTAMP NOT NULL DEFAULT NOW(),
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  items JSONB, -- Store returned items details
  device_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase returns table
CREATE TABLE IF NOT EXISTS purchase_returns (
  id SERIAL PRIMARY KEY,
  purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
  return_date TIMESTAMP NOT NULL DEFAULT NOW(),
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  items JSONB, -- Store returned items details
  device_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- COGS tracking table
CREATE TABLE IF NOT EXISTS cogs_entries (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  cost_price DECIMAL(12,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  device_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Accounts receivable summary
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  original_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  outstanding_amount DECIMAL(12,2) NOT NULL,
  due_date TIMESTAMP,
  device_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Accounts payable summary
CREATE TABLE IF NOT EXISTS accounts_payable (
  id SERIAL PRIMARY KEY,
  supplier_name VARCHAR(255) NOT NULL,
  purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
  original_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  outstanding_amount DECIMAL(12,2) NOT NULL,
  due_date TIMESTAMP,
  device_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_ledger_device_date ON financial_ledger(device_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_type ON financial_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer ON accounts_receivable(customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_supplier ON accounts_payable(supplier_name);
