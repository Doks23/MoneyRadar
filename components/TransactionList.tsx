import React, { useState, useMemo } from 'react';
import { Transaction, CategorizationRule, MonthlyExpense } from '../types';
import { formatCurrency, getDDMM } from '../utils/helpers';
import { getCategoryByDescription } from '../utils/categorize';
import { exportTransactionsToCSV, exportAggregatedToCSV } from '../utils/csvUtils';
import { ExportModal } from './ExportModal';
import { 
    ArrowUpIcon, ArrowDownIcon, EditIcon, DeleteIcon, SaveIcon, CancelIcon, 
    SortIcon, AddIcon, ExportIcon, ImportIcon, RuleIcon
} from './Icons';

interface TransactionListProps {
  transactions: Transaction[];
  monthlyExpensesByCategory: MonthlyExpense[];
  currency: string;
  rules: CategorizationRule[];
  allPossibleCategories: string[];
  onAddTransaction: () => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onImportClick: () => void;
  onAddRuleFromTransaction: (transaction: Transaction) => void;
  onBulkUpdateCategory: (ids: string[], category: string) => void;
}

type SortKey = keyof Transaction;

export const TransactionList: React.FC<TransactionListProps> = ({ 
    transactions, monthlyExpensesByCategory, currency, rules, allPossibleCategories, onAddTransaction, 
    onUpdateTransaction, onDeleteTransaction, onImportClick, onAddRuleFromTransaction, onBulkUpdateCategory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBank, setFilterBank] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending' });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Transaction>>({});
    
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [bulkCategory, setBulkCategory] = useState('');


  const { categoriesForFilter, banksForFilter } = useMemo(() => {
    const categories = new Set<string>(['all']);
    const banks = new Set<string>(['all']);
    transactions.forEach(tx => {
        categories.add(tx.category);
        banks.add(tx.bankName);
    });
    return { 
        categoriesForFilter: Array.from(categories),
        banksForFilter: Array.from(banks)
    };
  }, [transactions]);


  const sortedFilteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(tx => tx.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category === filterCategory);
    }
    
    if (filterBank !== 'all') {
        filtered = filtered.filter(tx => tx.bankName === filterBank);
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [transactions, searchTerm, filterCategory, filterBank, sortConfig]);

  const currentViewSummary = useMemo(() => {
    const creditTransactions = sortedFilteredTransactions.filter(tx => tx.amount > 0);
    const debitTransactions = sortedFilteredTransactions.filter(tx => tx.amount < 0);

    const creditSum = creditTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const debitSum = debitTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalCount: sortedFilteredTransactions.length,
      creditCount: creditTransactions.length,
      creditSum: creditSum,
      debitCount: debitTransactions.length,
      debitSum: Math.abs(debitSum),
    };
  }, [sortedFilteredTransactions]);

  const fullDatasetSummary = useMemo(() => {
    const creditTransactions = transactions.filter(tx => tx.amount > 0);
    const debitTransactions = transactions.filter(tx => tx.amount < 0);
    const creditSum = creditTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const debitSum = debitTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    return {
      totalCount: transactions.length,
      creditCount: creditTransactions.length,
      creditSum: creditSum,
      debitCount: debitTransactions.length,
      debitSum: Math.abs(debitSum),
    };
  }, [transactions]);

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          const allVisibleIds = sortedFilteredTransactions.map(tx => tx.id);
          setSelectedIds(new Set(allVisibleIds));
      } else {
          setSelectedIds(new Set());
      }
  };

  const handleApplyBulkEdit = () => {
    if (selectedIds.size > 0 && bulkCategory.trim()) {
        onBulkUpdateCategory(Array.from(selectedIds), bulkCategory);
        setSelectedIds(new Set());
        setBulkCategory('');
    }
  };


  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleEditClick = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditFormData(transaction);
  };
  
  const handleCancelClick = () => {
    setEditingId(null);
  };
  
  const handleSaveClick = () => {
    if (editingId) {
        onUpdateTransaction(editFormData as Transaction);
        setEditingId(null);
    }
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...editFormData, [name]: value };
    
    if (name === 'description') {
        const suggestedCategory = getCategoryByDescription(value, rules);
        if (suggestedCategory) {
            newFormData.category = suggestedCategory;
        }
    }
     if (name === 'amount') {
        newFormData.amount = parseFloat(value);
    }
    
    setEditFormData(newFormData);
  };

  const handleConfirmExport = (exportType: 'current' | 'full') => {
    const dataToExport = exportType === 'current' ? sortedFilteredTransactions : transactions;
    const fileNameSuffix = exportType === 'current' ? 'View' : 'Full';
    exportTransactionsToCSV(dataToExport, `MoneyRadar_Transaction_${fileNameSuffix}_${getDDMM()}.csv`);
    setIsExportModalOpen(false);
  };

  const handleExportSummary = () => {
    exportAggregatedToCSV(monthlyExpensesByCategory, `MoneyRadar_MonthlySummary_${getDDMM()}.csv`);
  };

  const handleDeleteRequest = (id: string) => {
    setTransactionToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteTransaction = () => {
    if (transactionToDeleteId) {
        onDeleteTransaction(transactionToDeleteId);
    }
    setIsDeleteConfirmOpen(false);
    setTransactionToDeleteId(null);
  };
  
  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setTransactionToDeleteId(null);
  };

  const SortableHeader: React.FC<{ sortKey: SortKey, title: string, className?: string }> = ({ sortKey, title, className }) => (
    <th className={`px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-surface-400 ${className}`}>
        <button onClick={() => requestSort(sortKey)} className="flex items-center space-x-1.5 hover:text-brand-600 transition-colors">
            <span>{title}</span>
            {sortConfig?.key === sortKey 
                ? (sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />)
                : <SortIcon className="h-3.5 w-3.5 opacity-50" />
            }
        </button>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
       {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-premium p-8 w-full max-w-sm animate-scale-in duration-200">
                <div className="w-12 h-12 bg-negative-50 rounded-full flex items-center justify-center text-negative-600 mb-6">
                    <DeleteIcon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Delete Transaction?</h2>
                <p className="text-surface-500 mb-8 leading-relaxed">This record will be permanently removed from your history. This action cannot be reversed.</p>
                <div className="flex gap-3">
                    <button type="button" onClick={cancelDelete} className="flex-1 bg-surface-100 text-surface-700 font-bold py-3 rounded-xl hover:bg-surface-200 transition-colors">Cancel</button>
                    <button type="button" onClick={confirmDeleteTransaction} className="flex-1 bg-negative-600 text-white font-bold py-3 rounded-xl hover:bg-negative-700 transition-colors shadow-lg shadow-negative-200">Delete</button>
                </div>
            </div>
        </div>
      )}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleConfirmExport}
        currentViewSummary={currentViewSummary}
        fullDatasetSummary={fullDatasetSummary}
        currency={currency}
      />
      
      <div className="p-6 border-b border-surface-50 flex flex-wrap items-center justify-between gap-6">
        <div>
            <h2 className="text-2xl font-display font-extrabold text-surface-900 tracking-tight">Ledger</h2>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mt-1">Detailed Transaction History</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <button onClick={onImportClick} className="group flex items-center gap-2 bg-white border border-surface-200 text-surface-600 font-bold py-2 px-4 rounded-xl hover:border-surface-300 hover:bg-surface-50 transition-all text-sm shadow-sm">
                <ImportIcon className="h-4 w-4 text-surface-400 group-hover:text-brand-500" /> 
                <span className="hidden sm:inline">Import</span>
            </button>
            <button onClick={() => setIsExportModalOpen(true)} className="group flex items-center gap-2 bg-white border border-surface-200 text-surface-600 font-bold py-2 px-4 rounded-xl hover:border-surface-300 hover:bg-surface-50 transition-all text-sm shadow-sm">
                <ExportIcon className="h-4 w-4 text-surface-400 group-hover:text-brand-500" />
                <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button onClick={onAddTransaction} className="flex items-center gap-2 bg-brand-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 text-sm">
                <AddIcon className="h-4 w-4"/> 
                <span>Add Record</span>
            </button>
        </div>
      </div>

      <div className="p-6 bg-surface-50/50 border-b border-surface-50 grid sm:grid-cols-3 gap-4">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Filter by description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 p-2.5 border border-surface-200 rounded-xl w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none bg-white text-sm"
            />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-2.5 border border-surface-200 rounded-xl w-full bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm font-medium"
        >
          {categoriesForFilter.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
        </select>
        <select
          value={filterBank}
          onChange={(e) => setFilterBank(e.target.value)}
          className="p-2.5 border border-surface-200 rounded-xl w-full bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm font-medium"
        >
          {banksForFilter.map(bank => <option key={bank} value={bank}>{bank === 'all' ? 'All Sources' : bank}</option>)}
        </select>
      </div>

      {selectedIds.size > 0 && (
          <div className="bg-brand-700 text-white px-6 py-4 flex flex-wrap items-center gap-6 animate-slide-down duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">{selectedIds.size}</div>
                <p className="font-bold">Records Selected</p>
              </div>
              <div className="flex-grow flex items-center gap-3">
                  <input
                      type="text"
                      value={bulkCategory}
                      onChange={(e) => setBulkCategory(e.target.value)}
                      placeholder="Assign new category..."
                      list="category-suggestions"
                      className="px-4 py-2 border-0 rounded-xl w-full sm:w-64 focus:ring-2 focus:ring-white/50 bg-white/10 placeholder:text-white/60 text-sm font-medium outline-none"
                  />
                  <datalist id="category-suggestions">
                      {allPossibleCategories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                  <button onClick={handleApplyBulkEdit} className="bg-white text-brand-700 font-bold py-2 px-6 rounded-xl hover:bg-surface-50 transition-colors shadow-lg text-sm">Update All</button>
                  <button onClick={() => setSelectedIds(new Set())} className="text-white/80 hover:text-white font-bold text-sm px-4">Clear Selection</button>
              </div>
          </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-50/50">
              <th className="p-4 w-12">
                  <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={sortedFilteredTransactions.length > 0 && selectedIds.size === sortedFilteredTransactions.length}
                      ref={el => {
                        if (el) {
                          el.indeterminate = selectedIds.size > 0 && selectedIds.size < sortedFilteredTransactions.length;
                        }
                      }}
                      className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 transition-all cursor-pointer"
                  />
              </th>
              <SortableHeader sortKey="date" title="Timestamp" />
              <SortableHeader sortKey="description" title="Description" />
              <SortableHeader sortKey="bankName" title="Source" />
              <SortableHeader sortKey="category" title="Category" />
              <SortableHeader sortKey="amount" title="Amount" className="text-right" />
              <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-surface-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {sortedFilteredTransactions.map((tx) => (
              <tr 
                key={tx.id} 
                className={`group hover:bg-surface-50/80 transition-colors ${selectedIds.has(tx.id) ? 'bg-brand-50/50' : ''}`}
              >
                {editingId === tx.id ? (
                    <>
                        <td className="p-4"></td>
                        <td className="p-4"><input type="date" name="date" value={editFormData.date?.split('T')[0]} onChange={handleEditFormChange} className="px-3 py-1.5 border border-surface-200 rounded-lg w-full text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" /></td>
                        <td className="p-4"><input type="text" name="description" value={editFormData.description} onChange={handleEditFormChange} className="px-3 py-1.5 border border-surface-200 rounded-lg w-full text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" /></td>
                        <td className="p-4"><input type="text" name="bankName" value={editFormData.bankName} onChange={handleEditFormChange} className="px-3 py-1.5 border border-surface-200 rounded-lg w-full text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" /></td>
                        <td className="p-4">
                           <select name="category" value={editFormData.category} onChange={handleEditFormChange} className="px-3 py-1.5 border border-surface-200 rounded-lg w-full bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                                {allPossibleCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                           </select>
                        </td>
                        <td className="p-4"><input type="number" name="amount" value={editFormData.amount} onChange={handleEditFormChange} className="px-3 py-1.5 border border-surface-200 rounded-lg w-full text-right text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" /></td>
                        <td className="p-4 text-right">
                           <div className="flex justify-end items-center space-x-2">
                                <button onClick={handleSaveClick} className="p-2 bg-positive-50 text-positive-600 rounded-lg hover:bg-positive-100 transition-colors"><SaveIcon className="h-4 w-4"/></button>
                                <button onClick={handleCancelClick} className="p-2 bg-surface-100 text-surface-500 rounded-lg hover:bg-surface-200 transition-colors"><CancelIcon className="h-4 w-4"/></button>
                           </div>
                        </td>
                    </>
                ) : (
                    <>
                        <td className="p-4">
                           <input
                                type="checkbox"
                                checked={selectedIds.has(tx.id)}
                                onChange={() => handleSelect(tx.id)}
                                className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 transition-all cursor-pointer"
                            />
                        </td>
                        <td className="p-4 text-xs font-bold text-surface-500 whitespace-nowrap">{tx.date}</td>
                        <td className="p-4 text-sm font-semibold text-surface-700">
                            <div className="flex items-center gap-2">
                                <span className="max-w-xs truncate" title={tx.description}>{tx.description}</span>
                                {tx.isManuallyEdited && (
                                    <span className="p-1 bg-surface-100 rounded text-surface-400" title="Manually Edited">
                                        <EditIcon className="h-3 w-3" />
                                    </span>
                                )}
                            </div>
                        </td>
                        <td className="p-4 text-xs font-semibold text-surface-500">{tx.bankName}</td>
                        <td className="p-4">
                          <span className="inline-flex px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-surface-600 bg-surface-100 rounded-lg">
                            {tx.category}
                          </span>
                        </td>
                        <td className={`p-4 text-sm font-extrabold text-right whitespace-nowrap ${tx.amount >= 0 ? 'text-positive-600' : 'text-negative-600'}`}>
                          {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount, currency)}
                        </td>
                        <td className="p-4 text-right">
                           <div className="flex justify-end items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onAddRuleFromTransaction(tx)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Create Rule"><RuleIcon className="h-4 w-4"/></button>
                                <button onClick={() => handleEditClick(tx)} className="p-2 text-surface-600 hover:bg-surface-100 rounded-lg transition-colors" title="Edit"><EditIcon className="h-4 w-4"/></button>
                                <button onClick={() => handleDeleteRequest(tx.id)} className="p-2 text-negative-500 hover:bg-negative-50 rounded-lg transition-colors" title="Delete"><DeleteIcon className="h-4 w-4"/></button>
                           </div>
                        </td>
                    </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedFilteredTransactions.length === 0 && (
          <div className="p-20 text-center">
              <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-4 text-surface-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <p className="text-surface-400 font-bold">No transactions found</p>
              <p className="text-xs text-surface-400 mt-1">Try adjusting your filters or search criteria</p>
          </div>
      )}
    </div>
  );
};
