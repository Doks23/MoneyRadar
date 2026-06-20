import React, { useState, useEffect } from 'react';
import { Transaction, CategorizationRule } from '../types';
import { extractMerchant } from '../utils/statementParser';

interface AddRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: CategorizationRule) => void;
  transaction: Transaction | null;
  allPossibleCategories: string[];
}

const suggestKeyword = (description: string): string => {
  if (!description) return '';
  const merchant = extractMerchant(description);
  if (merchant && merchant.length > 2) {
      return merchant;
  }
  return description;
};


export const AddRuleModal: React.FC<AddRuleModalProps> = ({ isOpen, onClose, onSave, transaction, allPossibleCategories }) => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (transaction) {
      setKeyword(suggestKeyword(transaction.description));
      setCategory(transaction.category);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim() && category.trim()) {
      onSave({ keyword, category });
    }
  };

  return (
    <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-premium p-6 w-full max-w-md animate-scale-in">
        <h2 className="text-xl font-display font-bold text-surface-900 mb-4">Create Rule</h2>
        <p className="text-sm text-surface-500 mb-2">Create a rule based on transaction:</p>
        <div className="bg-surface-50 p-3 rounded-xl mb-4 text-sm text-surface-700 font-mono border border-surface-200 truncate" title={transaction.description}>
            {transaction.description}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="keyword" className="block text-sm font-semibold text-surface-700 mb-1.5">Keyword</label>
              <input 
                type="text" 
                id="keyword"
                name="keyword" 
                placeholder="Keyword from description" 
                value={keyword} 
                onChange={(e) => setKeyword(e.target.value)} 
                className="px-3 py-2.5 bg-surface-50 border border-surface-200 rounded-xl w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                required 
              />
               <p className="text-xs text-surface-400 mt-1.5">Transactions containing this keyword will be assigned the category below. Supports RegExp (e.g., <code className="bg-surface-200 px-1 rounded text-surface-600">amazon|flipkart</code>).</p>
            </div>
             <div>
              <label htmlFor="category" className="block text-sm font-semibold text-surface-700 mb-1.5">Category</label>
              <div className="relative">
                <input 
                  type="text" 
                  id="category"
                  name="category" 
                  placeholder="Category" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="px-3 py-2.5 bg-surface-50 border border-surface-200 rounded-xl w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                  required
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                    {allPossibleCategories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="bg-surface-100 text-surface-700 font-bold py-2.5 px-5 rounded-xl hover:bg-surface-200 transition-all text-sm">Cancel</button>
            <button type="submit" className="bg-brand-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-brand-700 transition-all shadow-md shadow-brand-200 text-sm">Save Rule</button>
          </div>
        </form>
      </div>
    </div>
  );
};
