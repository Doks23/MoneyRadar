import React from 'react';
import { ImportIcon, AnalysisIcon, RadarIcon, BankIcon } from './Icons';

interface WelcomeProps {
    onImportClick: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onImportClick }) => {
  return (
    <div className="relative overflow-hidden bg-white rounded-3xl shadow-card border border-surface-200 p-8 sm:p-12 lg:p-16 text-center">
      <div className="absolute top-0 left-0 w-72 h-72 bg-brand-50 rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-50 rounded-full blur-3xl opacity-30 translate-x-1/3 translate-y-1/3"></div>

      <div className="relative z-10">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl shadow-lg shadow-brand-200 mb-8 animate-float">
          <RadarIcon className="w-12 h-12 text-white" />
        </div>
        
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-surface-900 mb-6 tracking-tight leading-[1.1]">
          Intelligent{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">Expense Tracking</span>
        </h2>
        
        <p className="text-lg sm:text-xl text-surface-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload any bank statement — PDFs, photos, or CSVs — and let our AI engine categorize your spending with precision.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <div className="flex flex-col items-center">
            <button
              onClick={onImportClick}
              className="group relative px-8 py-4 bg-surface-900 text-white font-bold rounded-2xl hover:bg-surface-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-3 overflow-hidden"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <ImportIcon className="h-5 w-5" />
                Import Existing Data
            </button>
            <p className="mt-3 text-[11px] font-semibold text-surface-400 uppercase tracking-widest">Supports JSON &amp; CSV</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 text-left">
          <div className="group p-6 bg-surface-50 rounded-2xl border border-surface-100 hover:border-brand-200 hover:bg-white hover:shadow-card-hover transition-all duration-300">
            <div className="w-11 h-11 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-sm">
              <AnalysisIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-surface-800 mb-2">Multi-Format AI</h3>
            <p className="text-sm text-surface-400 leading-relaxed">Advanced OCR and NLP process everything from blurry photos to complex digital PDFs.</p>
          </div>
          <div className="group p-6 bg-surface-50 rounded-2xl border border-surface-100 hover:border-brand-200 hover:bg-white hover:shadow-card-hover transition-all duration-300">
            <div className="w-11 h-11 bg-gradient-to-br from-positive-400 to-positive-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-sm">
              <RadarIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-surface-800 mb-2">Deep Visualization</h3>
            <p className="text-sm text-surface-400 leading-relaxed">Beautiful interactive charts give you a helicopter view of your financial trajectory.</p>
          </div>
          <div className="group p-6 bg-surface-50 rounded-2xl border border-surface-100 hover:border-brand-200 hover:bg-white hover:shadow-card-hover transition-all duration-300">
            <div className="w-11 h-11 bg-gradient-to-br from-surface-400 to-surface-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-sm">
              <BankIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-surface-800 mb-2">Privacy First</h3>
            <p className="text-sm text-surface-400 leading-relaxed">Your data stays local. We only use AI for analysis; we never store your statements.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
