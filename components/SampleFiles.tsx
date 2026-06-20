import React, { useState, useEffect, useRef } from 'react';
import { DownloadIcon, AnalysisIcon, CheckCircleIcon, ChartIcon, ArrowDownIcon } from './Icons';

interface SampleFile {
  id: string;
  bank: string;
  accountType: string;
  format: string;
  fileName: string;
  color: string;
  txnCount: number;
  gradient: string;
  textClass: string;
}

const sampleFiles: SampleFile[] = [
  { id: 'hdfc', bank: 'HDFC Bank', accountType: 'Savings', format: 'CSV', fileName: 'hdfc_savings.csv', color: '#2563eb', gradient: 'from-blue-500/10 to-blue-600/5', textClass: 'text-blue-600', txnCount: 33 },
  { id: 'sbi', bank: 'SBI', accountType: 'Savings', format: 'TXT', fileName: 'sbi_savings.txt', color: '#4f46e5', gradient: 'from-indigo-500/10 to-indigo-600/5', textClass: 'text-indigo-600', txnCount: 30 },
  { id: 'icici-xlsx', bank: 'ICICI Bank', accountType: 'Savings', format: 'XLSX', fileName: 'icici_savings.xlsx', color: '#ea580c', gradient: 'from-orange-500/10 to-orange-600/5', textClass: 'text-orange-600', txnCount: 36 },
  { id: 'axis', bank: 'Axis Bank', accountType: 'Savings', format: 'XLS', fileName: 'axis_savings.xls', color: '#dc2626', gradient: 'from-red-500/10 to-red-600/5', textClass: 'text-red-600', txnCount: 30 },
  { id: 'kotak', bank: 'Kotak Mahindra', accountType: 'Current', format: 'PDF', fileName: 'kotak_current.pdf', color: '#d97706', gradient: 'from-amber-500/10 to-amber-600/5', textClass: 'text-amber-600', txnCount: 36 },
  { id: 'icici-cc', bank: 'ICICI Bank', accountType: 'Credit Card', format: 'PDF', fileName: 'icici_credit.pdf', color: '#9333ea', gradient: 'from-purple-500/10 to-purple-600/5', textClass: 'text-purple-600', txnCount: 36 },
];

interface SampleFilesProps {
  onFileUpload: (files: File[]) => void;
  disabled: boolean;
}

export const SampleFiles: React.FC<SampleFilesProps> = ({ onFileUpload, disabled }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const getFileUrl = (fileName: string) => `/samples/${fileName}`;

  const handleDownload = (fileName: string) => {
    const a = document.createElement('a');
    a.href = getFileUrl(fileName);
    a.download = fileName;
    a.click();
  };

  const handleDownloadAll = async () => {
    for (const f of sampleFiles) {
      handleDownload(f.fileName);
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const handleAnalyze = async (file: SampleFile) => {
    if (disabled || loadingId || loadingAll) return;
    setLoadingId(file.id);
    setSuccessId(null);
    try {
      const response = await fetch(getFileUrl(file.fileName));
      const blob = await response.blob();
      const fileObj = new File([blob], file.fileName, { type: blob.type });
      onFileUpload([fileObj]);
      setSuccessId(file.id);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (err) {
      console.error('Failed to load sample file:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleLoadAll = async () => {
    if (disabled || loadingAll) return;
    setLoadingAll(true);
    try {
      const results = await Promise.allSettled(
        sampleFiles.map(async (f) => {
          const response = await fetch(getFileUrl(f.fileName));
          const blob = await response.blob();
          return new File([blob], f.fileName, { type: blob.type });
        })
      );
      const files = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<File>).value);
      if (files.length > 0) onFileUpload(files);
    } catch (err) {
      console.error('Failed to load sample files:', err);
    } finally {
      setLoadingAll(false);
    }
  };

  const totalTxns = sampleFiles.reduce((sum, f) => sum + f.txnCount, 0);

  return (
    <div ref={sectionRef} className="bg-white rounded-2xl shadow-card border border-surface-200 overflow-hidden">
      <div className="relative bg-gradient-to-br from-brand-50 via-white to-surface-50 px-6 sm:px-8 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-brand-50 rounded-full blur-3xl opacity-40" />

        <div className={`relative transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-brand-600 rounded-lg shadow-sm">
                  <ChartIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">Demo Data</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-surface-900 tracking-tight">
                Explore with sample data
              </h2>
              <p className="text-sm text-surface-400 mt-2 max-w-xl leading-relaxed">
                No statements handy? Load pre-generated bank statements and see MoneyRadar in action — no API key needed.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadAll}
                disabled={disabled || loadingAll}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-semibold text-sm rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-brand-200 hover:shadow-md hover:shadow-brand-200"
              >
                {loadingAll ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4" />
                )}
                {loadingAll ? 'Loading all...' : 'Load all samples'}
              </button>
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-surface-500 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 hover:text-surface-700 transition-all"
              >
                <DownloadIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Download all</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 sm:gap-8 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              <span className="text-surface-500"><strong className="text-surface-700">{sampleFiles.length}</strong> sample files</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-positive-500" />
              <span className="text-surface-500"><strong className="text-surface-700">{totalTxns}</strong> transactions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-surface-500"><strong className="text-surface-700">Apr – Jun 2026</strong> &nbsp;3 months</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-surface-500"><strong className="text-surface-700">15+</strong> spending categories</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 pt-0 -mt-2">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {sampleFiles.map((file, i) => {
            const isActive = loadingId === file.id;
            const isDone = successId === file.id;

            return (
              <button
                key={file.id}
                onClick={() => handleAnalyze(file)}
                disabled={disabled || loadingAll || loadingId !== null}
                className={`group relative flex items-center gap-4 w-full px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200
                  ${isDone
                    ? 'bg-positive-50 border-positive-200'
                    : 'bg-white border-surface-200 hover:shadow-sm'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                style={{ transitionDelay: `${i * 50}ms` }}
                onMouseEnter={(e) => { if (!isDone) e.currentTarget.style.borderColor = file.color; }}
                onMouseLeave={(e) => { if (!isDone) e.currentTarget.style.borderColor = ''; }}
              >
                <div
                  className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${file.gradient} flex items-center justify-center text-lg font-bold shadow-sm ${file.textClass}`}
                >
                  {file.bank.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-surface-900 truncate">{file.bank}</span>
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-surface-100 text-surface-500 rounded-md">{file.format}</span>
                  </div>
                  <p className="text-xs text-surface-400">
                    {file.accountType} &middot; {file.txnCount} transactions &middot; 3 months
                  </p>
                </div>

                <div className="shrink-0 flex items-center">
                  {isActive ? (
                    <div className="w-5 h-5 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                  ) : isDone ? (
                    <CheckCircleIcon className="w-5 h-5 text-positive-500" />
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(file.fileName); }}
                        className="p-1.5 rounded-lg text-surface-300 hover:text-surface-600 hover:bg-surface-100 transition-all opacity-0 group-hover:opacity-100 -mr-1"
                        title="Download file"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                      <span className={`text-xs font-semibold ${file.textClass} opacity-0 group-hover:opacity-100 transition-all`}>
                        Load
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
