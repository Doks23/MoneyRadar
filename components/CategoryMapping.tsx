import React, { useState, useRef, useMemo } from 'react';
import { CategorizationRule } from '../types';
import { getDDMM } from '../utils/helpers';
import { 
    ImportIcon, ExportIcon, EditIcon, DeleteIcon, 
    SaveIcon, CancelIcon, ArrowUpIcon, ArrowDownIcon, SortIcon 
} from './Icons';

interface CategoryMappingProps {
  rules: CategorizationRule[];
  onAddRule: (rule: CategorizationRule) => void;
  onRemoveRule: (index: number) => void;
  onUpdateRule: (index: number, rule: CategorizationRule) => void;
  onSetRules: (rules: CategorizationRule[]) => void;
}

const exportRulesToCSV = (rules: CategorizationRule[], filename: string) => {
  const headers = ['keyword', 'category'];
  const csvContent = [
    headers.join(','),
    ...rules.map(rule => {
      const keyword = `"${rule.keyword.replace(/"/g, '""')}"`;
      const category = `"${rule.category.replace(/"/g, '""')}"`;
      return `${keyword},${category}`;
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const parseRulesFromCSV = (csvText: string): CategorizationRule[] => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].trim().toLowerCase().split(',').map(h => h.replace(/"/g, '').trim());
  const keywordIndex = headers.indexOf('keyword');
  const categoryIndex = headers.indexOf('category');

  if (keywordIndex === -1 || categoryIndex === -1) {
    throw new Error("Invalid CSV format. Header must contain 'keyword' and 'category'.");
  }

  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^",\r]+)(?=\s*,|\s*$)/g) || [];
    const keyword = (values[keywordIndex] || '').replace(/"/g, '').trim();
    const category = (values[categoryIndex] || '').replace(/"/g, '').trim();

    if (keyword && category) {
      return { keyword, category };
    }
    return null;
  }).filter((rule): rule is CategorizationRule => rule !== null);
};


export const CategoryMapping: React.FC<CategoryMappingProps> = ({ 
    rules, onAddRule, onRemoveRule, onUpdateRule, onSetRules
}) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editKeyword, setEditKeyword] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [ruleToDeleteIndex, setRuleToDeleteIndex] = useState<number | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof CategorizationRule; direction: 'ascending' | 'descending' } | null>({ key: 'keyword', direction: 'ascending' });

  const filteredSortedRules = useMemo(() => {
    let filtered = [...rules].filter(rule => 
        rule.keyword.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rule.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
  }, [rules, searchTerm, sortConfig]);

  const requestSort = (key: keyof CategorizationRule) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim() && newCategory.trim()) {
      onAddRule({ keyword: newKeyword, category: newCategory });
      setNewKeyword('');
      setNewCategory('');
    }
  };

  const handleEdit = (index: number) => {
    const originalIndex = rules.findIndex(r => r.keyword === filteredSortedRules[index].keyword && r.category === filteredSortedRules[index].category);
    setEditIndex(originalIndex);
    setEditKeyword(rules[originalIndex].keyword);
    setEditCategory(rules[originalIndex].category);
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setEditKeyword('');
    setEditCategory('');
  };

  const handleSave = (index: number) => {
    if (editKeyword.trim() && editCategory.trim()) {
      onUpdateRule(index, { keyword: editKeyword, category: editCategory });
      handleCancelEdit();
    }
  };
  
  const handleRequestDelete = (index: number) => {
    const originalIndex = rules.findIndex(r => r.keyword === filteredSortedRules[index].keyword && r.category === filteredSortedRules[index].category);
    setRuleToDeleteIndex(originalIndex);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (ruleToDeleteIndex !== null) {
        onRemoveRule(ruleToDeleteIndex);
    }
    setIsConfirmOpen(false);
    setRuleToDeleteIndex(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setRuleToDeleteIndex(null);
  };
  
  const handleExport = () => {
    exportRulesToCSV(rules, `MoneyRadar_CategoryMapping_${getDDMM()}.csv`);
  };
  
  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedRules = parseRulesFromCSV(event.target?.result as string);
            const rulesMap = new Map(rules.map(r => [r.keyword.toLowerCase(), r]));
            importedRules.forEach(r => rulesMap.set(r.keyword.toLowerCase(), r));
            onSetRules(Array.from(rulesMap.values()));
        } catch (error: any) {
            alert(error.message || "Failed to parse CSV file.");
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const SortableHeader: React.FC<{ sortKey: keyof CategorizationRule, title: string, className?: string }> = ({ sortKey, title, className }) => (
    <th className={`p-2 text-sm font-semibold tracking-wide ${className}`}>
        <button onClick={() => requestSort(sortKey)} className="flex items-center space-x-1 hover:text-brand-700">
            <span>{title}</span>
            {sortConfig?.key === sortKey 
                ? (sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />)
                : <SortIcon className="h-4 w-4 text-surface-400" />
            }
        </button>
    </th>
  );

  return (
    <details className="w-full bg-white p-4 rounded-2xl shadow-card border border-surface-200" open={false}>
      <summary className="text-lg font-display font-bold text-surface-900 cursor-pointer">
        Category Mapping Rules
      </summary>
      <div className="mt-4 relative">
          {isConfirmOpen && (
            <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-xl shadow-premium p-6 w-full max-w-sm">
                    <div className="w-12 h-12 bg-negative-50 rounded-full flex items-center justify-center text-negative-600 mb-4">
                        <DeleteIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900 mb-2">Delete Rule</h2>
                    <p className="text-surface-500 mb-6">Are you sure you want to delete this categorization rule?</p>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={handleCancelDelete} className="bg-surface-100 text-surface-700 font-bold py-2.5 px-5 rounded-xl hover:bg-surface-200 transition-all">Cancel</button>
                        <button type="button" onClick={handleConfirmDelete} className="bg-negative-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-negative-700 transition-all shadow-lg shadow-negative-200">Delete</button>
                    </div>
                </div>
            </div>
          )}
          <div className="flex justify-end items-center gap-2 mb-4">
              <input type="file" ref={importFileRef} onChange={handleFileImport} className="hidden" accept=".csv" />
              <button onClick={handleImportClick} className="flex items-center gap-2 bg-white border border-surface-200 text-surface-600 font-semibold py-2 px-4 rounded-xl hover:bg-surface-50 hover:border-surface-300 transition-all text-sm shadow-sm">
                  <ImportIcon className="h-4 w-4"/> Import
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-surface-200 text-surface-600 font-semibold py-2 px-4 rounded-xl hover:bg-surface-50 hover:border-surface-300 transition-all text-sm shadow-sm">
                  <ExportIcon className="h-4 w-4"/> Export
              </button>
          </div>

          <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-surface-50 rounded-xl border border-surface-200">
              <div className="sm:col-span-1">
                  <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="New Keyword (e.g., 'Netflix')" className="px-3 py-2 bg-white border border-surface-200 rounded-xl w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm" required />
                  <p className="text-[10px] text-surface-400 mt-1">Supports RegExp (e.g., <code className="bg-surface-200 px-1 rounded text-surface-600">amazon|flipkart</code>)</p>
              </div>
              <div className="sm:col-span-1">
                  <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category (e.g., 'Subscriptions')" className="px-3 py-2 bg-white border border-surface-200 rounded-xl w-full focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm" required />
              </div>
              <button type="submit" className="bg-brand-700 text-white px-4 py-2.5 rounded-xl hover:bg-brand-800 transition-all font-semibold text-sm shadow-md shadow-brand-200">Add New Rule</button>
          </form>

          <div className="mb-4">
                  <input type="text" placeholder="Filter by keyword or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl w-full sm:w-1/2 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm" />
          </div>
          
          <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left">
              <thead className="border-b-2 border-surface-200 sticky top-0 bg-white z-10 text-surface-500">
                  <tr>
                  <SortableHeader sortKey="keyword" title="Keyword" />
                  <SortableHeader sortKey="category" title="Category" />
                  <th className="p-2 text-sm font-semibold tracking-wide text-right">Actions</th>
                  </tr>
              </thead>
              <tbody>
                  {filteredSortedRules.map((rule, index) => (
                  <tr key={`${rule.keyword}-${index}`} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      {editIndex === rules.findIndex(r => r.keyword === rule.keyword && r.category === rule.category) ? (
                      <>
                          <td className="p-1"><input type="text" value={editKeyword} onChange={e => setEditKeyword(e.target.value)} className="px-2 py-1.5 border border-surface-200 rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" /></td>
                          <td className="p-1"><input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} className="px-2 py-1.5 border border-surface-200 rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" /></td>
                          <td className="p-1 text-right whitespace-nowrap">
                          <button onClick={() => handleSave(editIndex!)} className="text-positive-600 hover:text-positive-800 p-1.5 rounded-lg hover:bg-positive-50 transition-colors"><SaveIcon className="h-5 w-5"/></button>
                          <button onClick={handleCancelEdit} className="text-surface-500 hover:text-surface-700 p-1.5 rounded-lg hover:bg-surface-100 transition-colors"><CancelIcon className="h-5 w-5"/></button>
                          </td>
                      </>
                      ) : (
                      <>
                          <td className="p-2 text-sm text-surface-700 font-medium">{rule.keyword}</td>
                          <td className="p-2 text-sm text-surface-600">{rule.category}</td>
                          <td className="p-2 text-right whitespace-nowrap">
                          <button onClick={() => handleEdit(index)} className="text-brand-600 hover:text-brand-800 p-1.5 rounded-lg hover:bg-brand-50 transition-colors mr-1"><EditIcon className="h-5 w-5"/></button>
                          <button onClick={() => handleRequestDelete(index)} className="text-negative-500 hover:text-negative-700 p-1.5 rounded-lg hover:bg-negative-50 transition-colors"><DeleteIcon className="h-5 w-5"/></button>
                          </td>
                      </>
                      )}
                  </tr>
                  ))}
              </tbody>
              </table>
          </div>
      </div>
    </details>
  );
};
