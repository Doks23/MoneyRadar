import React from 'react';
import { AnalysisResult } from '../types';
import { formatCurrency } from '../utils/helpers';
import { IncomeIcon, ExpenseIcon, BalanceIcon, BankIcon } from './Icons';

interface AnalysisSummaryProps {
  summary: AnalysisResult;
  duplicateCount: number;
  onReviewDuplicates: () => void;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ summary, duplicateCount, onReviewDuplicates }) => {
  return (
    <div className="w-full bg-white rounded-b-xl">
      {duplicateCount > 0 && (
          <div className="mx-6 mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-wrap gap-4 justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                      <p className="font-bold text-amber-800 text-sm">Potential Duplicates Detected</p>
                      <p className="text-xs text-amber-600 font-medium">Found {duplicateCount} group(s) of identical transactions.</p>
                  </div>
              </div>
              <button 
                  onClick={onReviewDuplicates}
                  className="bg-amber-100 text-amber-800 text-xs font-bold py-2 px-4 rounded-xl hover:bg-amber-200 transition-colors border border-amber-200"
              >
                  Clean Data
              </button>
          </div>
      )}
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        <div className="group relative overflow-hidden bg-white rounded-2xl border border-surface-200 p-5 transition-all hover:shadow-card-hover hover:border-positive-200 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-positive-50 rounded-full -mr-8 -mt-8 opacity-50"></div>
            <div className="flex items-start justify-between relative">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 mb-1.5">Total Income</p>
                    <p className="text-2xl font-display font-extrabold text-surface-900 tracking-tight">{formatCurrency(summary.totalIncome, summary.currency)}</p>
                </div>
                <div className="p-3 bg-positive-50 rounded-xl text-positive-600 transition-all group-hover:scale-110 group-hover:bg-positive-100">
                    <IncomeIcon className="h-5 w-5"/>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 relative">
                <span className="text-[10px] font-bold px-2.5 py-1 bg-positive-50 text-positive-600 rounded-full border border-positive-100">CASH INFLOW</span>
            </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl border border-surface-200 p-5 transition-all hover:shadow-card-hover hover:border-negative-200 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-negative-50 rounded-full -mr-8 -mt-8 opacity-50"></div>
            <div className="flex items-start justify-between relative">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 mb-1.5">Total Expenses</p>
                    <p className="text-2xl font-display font-extrabold text-surface-900 tracking-tight">{formatCurrency(summary.totalExpenses, summary.currency)}</p>
                </div>
                <div className="p-3 bg-negative-50 rounded-xl text-negative-600 transition-all group-hover:scale-110 group-hover:bg-negative-100">
                    <ExpenseIcon className="h-5 w-5"/>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 relative">
                <span className="text-[10px] font-bold px-2.5 py-1 bg-negative-50 text-negative-600 rounded-full border border-negative-100">CASH OUTFLOW</span>
            </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl border border-surface-200 p-5 transition-all hover:shadow-card-hover hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-full -mr-8 -mt-8 opacity-50"></div>
            <div className="flex items-start justify-between relative">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 mb-1.5">Net Balance</p>
                    <p className={`text-2xl font-display font-extrabold tracking-tight ${summary.netBalance >= 0 ? 'text-surface-900' : 'text-negative-600'}`}>
                        {formatCurrency(summary.netBalance, summary.currency)}
                    </p>
                </div>
                <div className={`p-3 rounded-xl transition-all group-hover:scale-110 ${summary.netBalance >= 0 ? 'bg-brand-50 text-brand-600 group-hover:bg-brand-100' : 'bg-negative-50 text-negative-600 group-hover:bg-negative-100'}`}>
                    <BalanceIcon className="h-5 w-5"/>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 relative">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${summary.netBalance >= 0 ? 'bg-brand-50 text-brand-600 border-brand-100' : 'bg-negative-50 text-negative-600 border-negative-100'}`}>
                    {summary.netBalance >= 0 ? 'POSITIVE TREND' : 'NEGATIVE TREND'}
                </span>
            </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl border border-surface-200 p-5 transition-all hover:shadow-card-hover hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-surface-100 rounded-full -mr-8 -mt-8 opacity-50"></div>
            <div className="flex items-start justify-between relative">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 mb-1.5">Analyzed Files</p>
                    <p className="text-2xl font-display font-extrabold text-surface-900 tracking-tight">{summary.statementCount}</p>
                </div>
                <div className="p-3 bg-surface-100 rounded-xl text-surface-500 transition-all group-hover:scale-110 group-hover:bg-surface-200">
                    <BankIcon className="h-5 w-5"/>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 relative">
                <span className="text-[10px] font-bold px-2.5 py-1 bg-surface-100 text-surface-500 rounded-full border border-surface-200">DATA SOURCES</span>
            </div>
        </div>
      </div>
    </div>
  );
};
