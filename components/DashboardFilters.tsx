import React, { useRef, useEffect, useState } from 'react';
import { ViewType, MonthlyExpense } from '../types';
import { ClipboardIcon } from './Icons';
import { copyChartsToClipboard } from '../utils/helpers';

interface DashboardFiltersProps {
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  viewType: ViewType;
  setViewType: (viewType: ViewType) => void;
  dateBounds: { min: string; max: string };
  allPossibleCategories: string[];
  expenseViewExcludedCategories: string[];
  setExpenseViewExcludedCategories: (categories: string[]) => void;
  chartsContainerRef: React.RefObject<HTMLDivElement>;
  groupSmallSlices: boolean;
  setGroupSmallSlices: (value: boolean) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  monthlyDataForFilter: MonthlyExpense[];
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({ 
    dateRange, setDateRange, viewType, setViewType, dateBounds,
    allPossibleCategories, expenseViewExcludedCategories, setExpenseViewExcludedCategories,
    chartsContainerRef, groupSmallSlices, setGroupSmallSlices, selectedMonth, setSelectedMonth, monthlyDataForFilter
}) => {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [copyButtonText, setCopyButtonText] = useState('Copy Charts');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
            detailsRef.current.open = false;
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };
  
  const clearDates = () => setDateRange({ start: '', end: '' });

  const handleExcludedCategoryToggle = (category: string) => {
    setExpenseViewExcludedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

   const handleCopyCharts = async () => {
    setCopyButtonText('Copying...');
    const success = await copyChartsToClipboard(chartsContainerRef.current);
    setCopyButtonText(success ? 'Copied!' : 'Failed!');
    setTimeout(() => setCopyButtonText('Copy Charts'), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-card border border-surface-200">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h3 className="text-lg font-display font-bold text-surface-900 flex items-center gap-2">
          Dashboard
          <span className="text-[10px] font-semibold px-2 py-1 bg-brand-50 text-brand-600 rounded-full">CONTROLS</span>
        </h3>
         <div className="flex items-center gap-4">
            <button
                onClick={handleCopyCharts}
                className="flex items-center gap-1.5 bg-white border border-surface-200 text-surface-600 font-semibold py-2 px-4 rounded-xl hover:bg-surface-50 hover:text-surface-800 hover:border-surface-300 transition-all text-sm disabled:opacity-70 shadow-sm"
                disabled={copyButtonText !== 'Copy Charts'}
            >
                <ClipboardIcon className="h-4 w-4" />
                {copyButtonText}
            </button>
        </div>
      </div>
      <div className="grid md:grid-cols-4 gap-4 items-end">
        
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
                <label htmlFor="startDate" className="block text-sm font-semibold text-surface-600 mb-1.5">Start Date</label>
                <input 
                    type="date" id="startDate" name="start" value={dateRange.start} onChange={handleDateChange}
                    className="w-full px-3 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                    min={dateBounds.min} max={dateBounds.max}
                />
            </div>
            <div>
                <label htmlFor="endDate" className="block text-sm font-semibold text-surface-600 mb-1.5">End Date</label>
                <div className="flex items-center gap-2">
                    <input type="date" id="endDate" name="end" value={dateRange.end} onChange={handleDateChange}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                        min={dateBounds.min} max={dateBounds.max}
                    />
                    {dateRange.start || dateRange.end ? (
                      <button onClick={clearDates} className="p-2.5 text-surface-400 hover:text-negative-600 hover:bg-negative-50 rounded-xl transition-all shrink-0" title="Clear dates">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    ) : null}
                </div>
            </div>
        </div>

        <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-surface-600 mb-1.5">View Type</label>
            <div className="flex rounded-xl border border-surface-200 overflow-hidden bg-surface-50 p-0.5">
                <button onClick={() => setViewType('expense')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${
                        viewType === 'expense' ? 'bg-white text-brand-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                    }`}>
                    Expense
                </button>
                <button onClick={() => setViewType('full')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${
                        viewType === 'full' ? 'bg-white text-brand-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                    }`}>
                    Full
                </button>
            </div>
        </div>
        
        <div className="md:col-span-1">
            {viewType === 'expense' && (
            <details ref={detailsRef} className="relative">
                <summary className="bg-white border border-surface-200 text-surface-600 font-semibold py-2.5 px-4 rounded-xl hover:bg-surface-50 hover:border-surface-300 transition-all text-sm cursor-pointer list-none text-center shadow-sm">
                    Configure View
                </summary>
                <div className="absolute z-20 mt-2 w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-premium border border-surface-200 right-0">
                    <div className="p-4">
                        <p className="text-xs text-surface-500 mb-3 font-medium">Select categories to <span className="font-bold text-negative-600">exclude</span> from the Expense view.</p>
                        <div className="space-y-1 max-h-56 overflow-y-auto">
                        {allPossibleCategories
                            .map(category => (
                            <label key={category} className="flex items-center p-2 rounded-lg hover:bg-surface-50 text-sm cursor-pointer transition-colors">
                                <input type="checkbox"
                                    checked={expenseViewExcludedCategories.includes(category)}
                                    onChange={() => handleExcludedCategoryToggle(category)}
                                    className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                                />
                                <span className="ml-2.5 text-surface-700">{category}</span>
                            </label>
                        ))}
                        </div>
                    </div>
                </div>
            </details>
            )}
        </div>
      </div>
      
      <div className="mt-5 pt-5 border-t border-surface-100 flex flex-wrap gap-x-6 gap-y-3 items-center">
          <h4 className="text-sm font-semibold text-surface-700">Chart Options:</h4>
          <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={groupSmallSlices} onChange={(e) => setGroupSmallSlices(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 transition-colors"
              />
              <span className="text-sm text-surface-500 group-hover:text-surface-700 transition-colors">Group small expenses (&lt; 3%)</span>
          </label>
          <div className="flex items-center gap-2">
              <label htmlFor="month-select-dashboard" className="text-sm text-surface-500 whitespace-nowrap">Pie Chart Month:</label>
              <select id="month-select-dashboard" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-surface-700 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                  <option value="all">All Months</option>
                  {monthlyDataForFilter.map(m => (
                  <option key={m.month} value={m.month}>{m.month}</option>
                  ))}
              </select>
          </div>
      </div>
    </div>
  );
};
