import React, { useState, useEffect } from 'react';
import { Transaction, CategorizationRule } from '../types';
import { getCategoryByDescription } from '../utils/categorize';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'sourceFile'>) => void;
  rules: CategorizationRule[];
  currency: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSave, rules, currency }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    bankName: 'Manual Entry',
  });
  const [suggestedCategory, setSuggestedCategory] = useState('');

  useEffect(() => {
    if (formData.description) {
      const suggestion = getCategoryByDescription(formData.description, rules) || 'Misc';
      setSuggestedCategory(suggestion);
      if(!formData.category) {
        setFormData(prev => ({...prev, category: suggestion}));
      }
    }
  }, [formData.description, rules]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount) * (formData.type === 'expense' ? -1 : 1);
    onSave({
      date: formData.date,
      description: formData.description,
      amount: isNaN(amount) ? 0 : amount,
      category: formData.type === 'income' ? 'Income' : formData.category || suggestedCategory,
      bankName: formData.bankName,
      currency: currency
    });
  };

  return (
    <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-premium p-6 w-full max-w-md animate-scale-in">
        <h2 className="text-xl font-display font-bold text-surface-900 mb-4">Add Transaction</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="px-3 py-2.5 bg-surface-50 border border-surface-200 rounded-xl w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm" required />
            <input type="text" name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="px-3 py-2.5 bg-surface-50 border border-surface-200 rounded-xl w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm" required />
            <div className="flex gap-4">
                <input type="number" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} className="px-3 py-2.5 bg-surface-50 border border-surface-200 rounded-xl w-2/3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm" required step="0.01" />
                <select name="type" value={formData.type} onChange={handleChange} className="px-3 py-2.5 bg-surface-50 border border-surface-200 rounded-xl w-1/3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                </select>
            </div>
            {formData.type === 'expense' && (
                <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} className="px-3 py-2.5 bg-surface-50 border border-surface-200 rounded-xl w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm" required />
            )}
             <input type="text" name="bankName" placeholder="Bank Name" value={formData.bankName} onChange={handleChange} className="px-3 py-2.5 bg-surface-50 border border-surface-200 rounded-xl w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm" required />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="bg-surface-100 text-surface-700 font-bold py-2.5 px-5 rounded-xl hover:bg-surface-200 transition-all text-sm">Cancel</button>
            <button type="submit" className="bg-brand-700 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-brand-800 transition-all shadow-md shadow-brand-200 text-sm">Save Transaction</button>
          </div>
        </form>
      </div>
    </div>
  );
};
