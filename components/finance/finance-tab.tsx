import React from 'react';
import { 
  getFinanceCategories, 
  getFinanceTransactions, 
  addFinanceTransaction, 
  addFinanceCategory,
  addBudget, // Make sure this is included
  // other imports...
} from '@/app/actions/finance-actions';

const FinanceTab = () => {
  return (
    <div>
      <h1>Finance Tab</h1>
      {/* Add your finance components here */}
    </div>
  );
};

export default FinanceTab;
