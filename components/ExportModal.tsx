import React, { useState } from 'react';
import { formatCurrency } from '../utils/helpers';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';

interface Summary {
  totalCount: number;
  creditCount: number;
  creditSum: number;
  debitCount: number;
  debitSum: number;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (exportType: 'current' | 'full') => void;
  currentViewSummary: Summary;
  fullDatasetSummary: Summary;
  currency: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  currentViewSummary,
  fullDatasetSummary,
  currency,
}) => {
  const [exportType, setExportType] = useState<'current' | 'full'>('current');

  if (!isOpen) return null;

  const summaryToDisplay = exportType === 'current' ? currentViewSummary : fullDatasetSummary;

  return (
    <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-premium p-6 w-full max-w-lg animate-scale-in">
        <h2 className="text-xl font-display font-bold text-surface-900 mb-4">Export Transactions</h2>
        
        <div className="mb-6">
          <p className="font-semibold text-surface-700 mb-2 text-sm">Select data to export:</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className={`flex-1 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                exportType === 'current' 
                ? 'border-brand-500 bg-brand-50/50' 
                : 'border-surface-200 hover:border-brand-300 bg-white'
            }`}>
              <input
                type="radio"
                name="exportType"
                value="current"
                checked={exportType === 'current'}
                onChange={() => setExportType('current')}
                className="sr-only"
              />
              <div className="font-bold text-surface-900">Current View</div>
              <p className="text-sm text-surface-500 mt-1">Export only the filtered and sorted transactions currently displayed.</p>
            </label>
            <label className={`flex-1 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                exportType === 'full' 
                ? 'border-brand-500 bg-brand-50/50' 
                : 'border-surface-200 hover:border-brand-300 bg-white'
            }`}>
              <input
                type="radio"
                name="exportType"
                value="full"
                checked={exportType === 'full'}
                onChange={() => setExportType('full')}
                className="sr-only"
              />
              <div className="font-bold text-surface-900">Full Dataset</div>
              <p className="text-sm text-surface-500 mt-1">Export all transactions, ignoring current filters and sorting.</p>
            </label>
          </div>
        </div>

        <div className="bg-surface-50 p-4 rounded-xl border border-surface-200 mb-6">
          <h3 className="font-semibold text-surface-700 mb-3 text-sm">Export Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-lg p-3 border border-surface-100">
                <p className="text-[10px] uppercase tracking-widest font-bold text-surface-400">Records</p>
                <p className="text-2xl font-extrabold text-surface-900 mt-1">{summaryToDisplay.totalCount}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-surface-100">
                <p className="text-[10px] uppercase tracking-widest font-bold text-surface-400">Credits</p>
                <div className="text-lg font-extrabold text-positive-600 flex items-center justify-center gap-1 mt-1">
                    <ArrowUpIcon className="h-4 w-4" />
                    <span>{formatCurrency(summaryToDisplay.creditSum, currency, 0)}</span>
                </div>
                <p className="text-[10px] text-surface-400 font-medium">({summaryToDisplay.creditCount} txns)</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-surface-100">
                <p className="text-[10px] uppercase tracking-widest font-bold text-surface-400">Debits</p>
                <div className="text-lg font-extrabold text-negative-600 flex items-center justify-center gap-1 mt-1">
                    <ArrowDownIcon className="h-4 w-4" />
                    <span>{formatCurrency(summaryToDisplay.debitSum, currency, 0)}</span>
                </div>
                <p className="text-[10px] text-surface-400 font-medium">({summaryToDisplay.debitCount} txns)</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="bg-surface-100 text-surface-700 font-bold py-2.5 px-5 rounded-xl hover:bg-surface-200 transition-all text-sm">
            Cancel
          </button>
          <button type="button" onClick={() => onExport(exportType)} className="bg-brand-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 text-sm">
            Confirm Export
          </button>
        </div>
      </div>
    </div>
  );
};
