import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  ImportIcon, AnalysisIcon, RadarIcon, BankIcon,
  UploadIcon, CheckCircleIcon, ShieldIcon, StepIcon,
  ChartIcon, SettingsIcon
} from './Icons';

interface WelcomeProps {
    onFileUpload: (files: File[]) => void;
    onImportClick: () => void;
    isLoading: boolean;
}

const FileUploadCard: React.FC<{ onFileUpload: (files: File[]) => void; disabled: boolean }> = ({ onFileUpload, disabled }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!disabled) setUploadedFiles([]);
  }, [disabled]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFiles(acceptedFiles);
      onFileUpload(acceptedFiles);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    onDragEnter: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative w-full border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer
        ${isDragActive
          ? 'border-brand-500 bg-brand-50/80 scale-[1.01] shadow-lg shadow-brand-100'
          : 'border-surface-200 bg-white hover:border-brand-400 hover:bg-surface-50/80 hover:shadow-card-hover'}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <input {...getInputProps()} />
      {uploadedFiles.length > 0 ? (
        <div className="flex flex-col items-center animate-slide-up">
          <div className="p-3 bg-positive-50 rounded-full mb-4 shadow-sm">
            <CheckCircleIcon className="w-10 h-10 text-positive-500" />
          </div>
          <p className="font-bold text-lg text-surface-800 mb-1">{uploadedFiles.length} File{uploadedFiles.length > 1 ? 's' : ''} Received</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto mt-2">
            {uploadedFiles.map(f => (
                <span key={f.name} className="px-3 py-1 bg-surface-100 border border-surface-200 rounded-lg text-xs font-medium text-surface-600">{f.name}</span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-surface-400">
            <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
            <span className="font-medium">Processing through AI analysis engine...</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className={`p-3 rounded-xl mb-4 transition-all duration-300 ${isDragActive ? 'bg-brand-100 scale-110' : 'bg-surface-100 group-hover:bg-brand-50 group-hover:scale-105'}`}>
            <UploadIcon className={`w-8 h-8 transition-colors duration-300 ${isDragActive ? 'text-brand-600' : 'text-surface-400 group-hover:text-brand-500'}`} />
          </div>
          {isDragActive ? (
            <p className="text-lg font-bold text-brand-700 animate-pulse">Release to start analysis</p>
          ) : (
            <>
              <p className="text-base font-bold text-surface-800 mb-1">Drag & drop files here</p>
              <p className="text-xs text-surface-400 mb-4">or click to browse</p>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-semibold text-sm rounded-lg hover:bg-brand-700 transition-all shadow-sm">
                <UploadIcon className="w-4 h-4" />
                Browse Statement Files
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const Welcome: React.FC<WelcomeProps> = ({ onFileUpload, onImportClick, isLoading }) => {
  return (
    <div className="space-y-10 sm:space-y-14">
      {/* ─── Hero Section ───────────────────────────── */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-surface-900 mb-5 tracking-tight leading-[1.1]">
          Turn statements into{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">spending intelligence</span>
        </h2>
        <p className="text-base sm:text-lg text-surface-400 max-w-2xl mx-auto leading-relaxed mb-6">
          Upload bank statements, credit card bills, CSV exports, or screenshots. MoneyRadar extracts transactions,
          categorizes spending, detects duplicates, and builds your expense dashboard.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-50 border border-surface-200 rounded-full text-sm text-surface-500">
          <ShieldIcon className="w-4 h-4 text-positive-500" />
          <span className="font-medium">Private by design — your financial data stays in your browser.</span>
        </div>
      </div>

      {/* ─── Action Cards ────────────────────────────── */}
      <div className="grid md:grid-cols-5 gap-5">
        {/* Upload Card — Primary, larger */}
        <div className="md:col-span-3 bg-white rounded-2xl shadow-card border border-surface-200 p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="p-3 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-sm shrink-0">
              <UploadIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-surface-900">Upload New Statement</h3>
              <p className="text-sm text-surface-400 mt-1">
                Start here if you want to analyze a new bank or credit card statement.
              </p>
            </div>
          </div>

          <FileUploadCard onFileUpload={onFileUpload} disabled={isLoading} />

          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-semibold uppercase tracking-wider">
            <span className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg">PDF</span>
            <span className="px-3 py-1.5 bg-positive-50 text-positive-600 rounded-lg">CSV</span>
            <span className="px-3 py-1.5 bg-surface-100 text-surface-600 rounded-lg">TXT</span>
            <span className="px-3 py-1.5 bg-negative-50 text-negative-600 rounded-lg">JPG</span>
            <span className="px-3 py-1.5 bg-negative-50 text-negative-600 rounded-lg">PNG</span>
          </div>

          <p className="text-xs text-surface-400 mt-4 leading-relaxed">
            Handles multiple files, password-protected PDFs, scanned statements, and bank or credit card formats.
          </p>
        </div>

        {/* Import Card — Secondary, smaller */}
        <div className="md:col-span-2 bg-surface-50 rounded-2xl border border-surface-200 p-6 sm:p-8 flex flex-col">
          <div className="flex items-start gap-4 mb-5">
            <div className="p-3 bg-surface-200 rounded-xl shrink-0">
              <ImportIcon className="w-5 h-5 text-surface-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-surface-800">Import Existing Data</h3>
              <p className="text-sm text-surface-400 mt-1">
                Use this if you already exported data from MoneyRadar.
              </p>
            </div>
          </div>

          <div className="flex-1">
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-surface-200">
                <div className="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-surface-500">JSON</div>
                <div>
                  <p className="text-sm font-semibold text-surface-700">MoneyRadar Export</p>
                  <p className="text-[11px] text-surface-400">Full analysis data</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-surface-200">
                <div className="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-surface-500">CSV</div>
                <div>
                  <p className="text-sm font-semibold text-surface-700">Transaction CSV</p>
                  <p className="text-[11px] text-surface-400">Imported transactions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-surface-200">
                <div className="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-surface-500">CSV</div>
                <div>
                  <p className="text-sm font-semibold text-surface-700">Category Rules</p>
                  <p className="text-[11px] text-surface-400">Categorization rules</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onImportClick}
            className="w-full px-5 py-2.5 bg-white text-surface-700 font-semibold text-sm border-2 border-surface-200 rounded-lg hover:bg-surface-50 hover:border-surface-300 transition-all"
          >
            Import Saved Data
          </button>

          <p className="text-xs text-surface-400 mt-3 leading-relaxed text-center">
            Restore previous analysis, load saved rules, or continue work from another browser.
          </p>
        </div>
      </div>

      {/* ─── What Happens Next — Steps ──────────────── */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-200 p-6 sm:p-8">
        <h3 className="text-lg font-bold text-surface-900 text-center mb-8">What happens next?</h3>
        <div className="grid sm:grid-cols-5 gap-4 sm:gap-6">
          {[
            { icon: UploadIcon, label: 'Extract', desc: 'Parses PDFs, images, CSVs, and text files into structured transaction data.' },
            { icon: SettingsIcon, label: 'Categorize', desc: 'Applies AI and rules to classify every line as income, expense, or transfer.' },
            { icon: CheckCircleIcon, label: 'Detect', desc: 'Finds duplicate transactions across multiple statements automatically.' },
            { icon: StepIcon, label: 'Review', desc: 'Edit descriptions, fix categories, add transactions, or remove duplicates.' },
            { icon: ChartIcon, label: 'Visualize', desc: 'View expense charts, monthly trends, and export clean CSV reports.' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="relative inline-flex mb-3">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{i + 1}</span>
              </div>
              <h4 className="font-bold text-sm text-surface-800 mb-1">{step.label}</h4>
              <p className="text-xs text-surface-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Feature Cards ──────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BankIcon, title: 'Works with many formats', desc: 'PDF, CSV, XLSX, XLS, TXT, JPG, PNG — from any bank or card issuer.' },
          { icon: RadarIcon, title: 'Smart transaction cleanup', desc: 'Auto-categorization, duplicate detection, and bulk category editing.' },
          { icon: ChartIcon, title: 'Charts after upload', desc: 'Interactive donut and bar charts break down spending by category and month.' },
          { icon: ShieldIcon, title: 'Private local workflow', desc: 'All processing happens in your browser. Nothing is uploaded to external servers.' },
        ].map((feature, i) => (
          <div key={i} className="group p-5 bg-white rounded-xl border border-surface-200 hover:border-brand-200 hover:shadow-card-hover transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center text-white mb-3 shadow-sm">
              <feature.icon className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-surface-800 mb-1">{feature.title}</h4>
            <p className="text-xs text-surface-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
