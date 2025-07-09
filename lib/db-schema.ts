/**
 * This file contains SQL schemas for the finance-related tables.
 * It can be used to create the tables if they don't exist.
 */

export const financeTableSchemas = {
  financialTransactions: `
    CREATE TABLE IF NOT EXISTS financial_transactions (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL,
      device_id INTEGER,
      transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
      amount DECIMAL(10, 2) NOT NULL,
      transaction_type VARCHAR(50) NOT NULL,
      description TEXT,
      transaction_name VARCHAR(255),
      category_name VARCHAR(255),
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `,

  pettyCash: `
    CREATE TABLE IF NOT EXISTS petty_cash (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL,
      transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
      amount DECIMAL(10, 2) NOT NULL,
      operation_type VARCHAR(50) NOT NULL,
      description TEXT,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `,

  expenseCategories: `
    CREATE TABLE IF NOT EXISTS expense_categories (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `,

  incomeCategories: `
    CREATE TABLE IF NOT EXISTS income_categories (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `,

  budgets: `
    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL,
      category_id INTEGER,
      category_name VARCHAR(255) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      period VARCHAR(50) NOT NULL,
      start_date TIMESTAMP NOT NULL DEFAULT NOW(),
      end_date TIMESTAMP,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `,
}

// Sample data for initial population
export const sampleFinanceData = {
  expenseCategories: [
    { name: "Rent", company_id: 1, created_by: 1 },
    { name: "Utilities", company_id: 1, created_by: 1 },
    { name: "Salaries", company_id: 1, created_by: 1 },
    { name: "Marketing", company_id: 1, created_by: 1 },
    { name: "Office Supplies", company_id: 1, created_by: 1 },
    { name: "Travel", company_id: 1, created_by: 1 },
    { name: "Insurance", company_id: 1, created_by: 1 },
  ],

  incomeCategories: [
    { name: "Sales", company_id: 1, created_by: 1 },
    { name: "Services", company_id: 1, created_by: 1 },
    { name: "Investments", company_id: 1, created_by: 1 },
    { name: "Other Income", company_id: 1, created_by: 1 },
  ],

  transactions: [
    {
      company_id: 1,
      device_id: 1,
      transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      amount: 1200.0,
      transaction_type: "income",
      description: "Monthly sales revenue",
      transaction_name: "Sales Revenue",
      category_name: "Sales",
      created_by: 1,
    },
    {
      company_id: 1,
      device_id: 1,
      transaction_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      amount: 500.0,
      transaction_type: "expense",
      description: "Office supplies purchase",
      transaction_name: "Office Supplies",
      category_name: "Office Supplies",
      created_by: 1,
    },
    {
      company_id: 1,
      device_id: 1,
      transaction_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      amount: 3000.0,
      transaction_type: "expense",
      description: "Monthly rent payment",
      transaction_name: "Rent",
      category_name: "Rent",
      created_by: 1,
    },
    {
      company_id: 1,
      device_id: 1,
      transaction_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      amount: 5000.0,
      transaction_type: "income",
      description: "Client project payment",
      transaction_name: "Client Payment",
      category_name: "Services",
      created_by: 1,
    },
    {
      company_id: 1,
      device_id: 1,
      transaction_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      amount: 800.0,
      transaction_type: "expense",
      description: "Utility bills",
      transaction_name: "Utilities",
      category_name: "Utilities",
      created_by: 1,
    },
    {
      company_id: 1,
      device_id: 1,
      transaction_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      amount: 4000.0,
      transaction_type: "expense",
      description: "Staff salaries",
      transaction_name: "Salaries",
      category_name: "Salaries",
      created_by: 1,
    },
  ],

  pettyCash: [
    {
      company_id: 1,
      transaction_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      amount: 500.0,
      operation_type: "ADD",
      description: "Cash added to petty cash",
      created_by: 1,
    },
    {
      company_id: 1,
      transaction_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      amount: 200.0,
      operation_type: "WITHDRAW",
      description: "Office supplies purchase",
      created_by: 1,
    },
    {
      company_id: 1,
      transaction_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      amount: 900.0,
      operation_type: "ADD",
      description: "Cash added to petty cash",
      created_by: 1,
    },
  ],
}
