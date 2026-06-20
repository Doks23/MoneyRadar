import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onClear: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClear }) => {
  return (
    <div className="mt-4 bg-white border border-negative-200 rounded-2xl p-5 shadow-card animate-slide-up">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-negative-50 rounded-xl shrink-0">
          <svg className="w-5 h-5 text-negative-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-negative-800 text-sm mb-1">Analysis Failed</h3>
          <p className="text-sm text-negative-600 break-words">{message}</p>
        </div>
        <button onClick={onClear} className="p-1.5 text-negative-400 hover:text-negative-600 hover:bg-negative-50 rounded-lg transition-colors shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
