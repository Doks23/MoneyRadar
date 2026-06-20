import React from 'react';

interface LoaderProps {
  progress: { current: number; total: number };
  processingFile: string | null;
}

export const Loader: React.FC<LoaderProps> = ({ progress, processingFile }) => {
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  
  return (
    <div className="mt-6 bg-white rounded-2xl border border-surface-200 p-8 shadow-card">
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-surface-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        <p className="font-bold text-surface-800 text-lg mb-2">
          {progress.total > 1 ? `Analyzing ${progress.current} of ${progress.total} files` : 'Analyzing file...'}
        </p>
        
        {processingFile && (
          <p className="text-sm text-surface-400 mb-6 max-w-md truncate">{processingFile}</p>
        )}
        
        <div className="w-full max-w-sm bg-surface-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        
        <p className="mt-3 text-xs font-semibold text-surface-400">{percent}% complete</p>
      </div>
    </div>
  );
};
