import React, { useState } from 'react';
import { AnalysisLogEntry } from '../types';
import { formatCurrency } from '../utils/helpers';
import { DeleteIcon } from './Icons';

interface AnalysisLogProps {
  logs: AnalysisLogEntry[];
  onClear: () => void;
  onReset?: () => void;
  isLoading?: boolean;
  progress?: { current: number, total: number };
  processingFile?: string | null;
  onRemoveFile: (fileName: string) => void;
}

export const AnalysisLog: React.FC<AnalysisLogProps> = ({ 
  logs, onClear, onReset, isLoading, progress, processingFile, onRemoveFile
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fileToRemove, setFileToRemove] = useState<string | null>(null);

  const sortedLogs = [...logs].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  const totalCost = logs.reduce((sum, log) => sum + (log.usage?.costInr ?? 0), 0);
  const totalTokens = logs.reduce((sum, log) => sum + (log.usage?.totalTokens ?? 0), 0);

  const handleRequestRemove = (fileName: string) => {
    setFileToRemove(fileName);
    setIsConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    if (fileToRemove) {
      onRemoveFile(fileToRemove);
    }
    setIsConfirmOpen(false);
    setFileToRemove(null);
  };

  const handleCancelRemove = () => {
    setIsConfirmOpen(false);
    setFileToRemove(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-200 overflow-hidden">
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-premium p-6 w-full max-w-sm">
                <div className="w-12 h-12 bg-negative-50 rounded-full flex items-center justify-center text-negative-600 mb-4">
                    <DeleteIcon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Remove File</h2>
                <p className="text-surface-500 mb-6">Are you sure you want to remove <span className="font-bold">{fileToRemove}</span> and all of its transactions? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={handleCancelRemove} className="bg-surface-100 text-surface-700 font-bold py-2.5 px-5 rounded-xl hover:bg-surface-200 transition-all">Cancel</button>
                    <button type="button" onClick={handleConfirmRemove} className="bg-negative-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-negative-700 transition-all shadow-lg shadow-negative-200">Remove</button>
                </div>
            </div>
        </div>
      )}
      <div className="p-4 flex justify-between items-center border-b border-surface-200">
            <h2 className="text-lg font-display font-bold text-surface-900">Analysis Log</h2>
            <div className="flex items-center gap-2">
                {logs.length > 0 && (
                    <button
                        onClick={onClear}
                        className="bg-surface-100 text-surface-600 font-semibold py-2 px-4 rounded-xl hover:bg-surface-200 transition-all text-sm shadow-sm"
                    >
                    Clear Log
                    </button>
                )}
                {onReset && (
                    <button
                        onClick={onReset}
                        className="bg-surface-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-surface-600 transition-all text-sm shadow-sm"
                    >
                        Start Over
                    </button>
                )}
            </div>
        </div>
        
        <div className="overflow-x-auto max-h-80 m-2">
          {isLoading && progress && (
             <div className="mx-2 mt-2 p-3 text-center bg-brand-50 border border-brand-200 text-brand-800 font-semibold text-sm animate-pulse rounded-xl">
                  Analyzing {progress.total > 1 ? `${progress.current + 1} of ${progress.total}` : 'file'}... {processingFile && `(${processingFile})`}
             </div>
          )}
          {logs.length > 0 ? (
            <><table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b-2 border-surface-200 bg-surface-50 sticky top-0 z-10 text-surface-500">
                    <tr>
                        <th className="p-2 font-semibold">File Name</th>
                        <th className="p-2 font-semibold">Status</th>
                        <th className="p-2 font-semibold text-center">Total Txns</th>
                        <th className="p-2 font-semibold">Credit (Count / Amount)</th>
                        <th className="p-2 font-semibold">Debit (Count / Amount)</th>
                        <th className="p-2 font-semibold text-center">Time (s)</th>
                        <th className="p-2 font-semibold text-right">Cost (₹)</th>
                        <th className="p-2 font-semibold">Start Time</th>
                        <th className="p-2 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedLogs.map(log => (
                        <tr 
                            key={log.id} 
                            className="border-b border-surface-100 hover:bg-surface-50 transition-colors" 
                            title={log.status === 'Error' ? log.message : log.message}
                        >
                            <td className="p-2 truncate max-w-[200px] text-surface-700 font-medium" title={log.fileName}>{log.fileName}</td>
                            <td className={`p-2 font-bold ${log.status === 'Success' ? 'text-positive-600' : log.status === 'Skipped' ? 'text-surface-400' : 'text-negative-600'}`}>
                                {log.status}
                            </td>
                            <td className="p-2 text-center font-medium text-surface-700">{log.totalTransactions}</td>
                            <td className="p-2 text-positive-700">
                               {log.creditCount} / {formatCurrency(log.creditAmount, 'INR', 0)}
                            </td>
                             <td className="p-2 text-negative-700">
                               {log.debitCount} / {formatCurrency(log.debitAmount, 'INR', 0)}
                            </td>
                            <td className="p-2 text-center text-surface-500">{log.durationSeconds}s</td>
                            <td className="p-2 text-right font-mono text-surface-700">
                                {log.usage ? log.usage.costInr.toFixed(4) : '-'}
                            </td>
                            <td className="p-2 text-surface-500">{log.startTime.toLocaleTimeString()}</td>
                            <td className="p-2 text-right">
                                {log.status === 'Success' && (
                                    <button 
                                        onClick={() => handleRequestRemove(log.fileName)} 
                                        className="text-negative-500 hover:text-negative-700 p-1.5 rounded-lg hover:bg-negative-50 transition-colors" 
                                        title={`Remove ${log.fileName} and its transactions`}
                                    >
                                        <DeleteIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {totalCost > 0 && (
              <div className="px-4 py-3 border-t border-surface-200 bg-surface-50 flex justify-between items-center text-sm">
                <span className="text-surface-500">
                  Total Tokens: <strong className="text-surface-700">{totalTokens.toLocaleString()}</strong>
                </span>
                <span className="text-surface-900 font-bold">
                  Total Cost: <span className="text-brand-700">₹{totalCost.toFixed(4)}</span>
                </span>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-12 text-surface-400">
                <div className="w-12 h-12 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25l1.5 1.5L12 9.75m6.75 2.25-1.5 1.5L15 9.75" /></svg>
                </div>
                <p className="font-semibold">No analysis logs yet.</p>
                <p className="text-xs mt-1">Upload a bank statement to begin.</p>
            </div>
          )}
        </div>
    </div>
  );
};
