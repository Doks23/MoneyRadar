import React from 'react';
import { LogoIcon, KeyIcon } from './Icons';

interface HeaderProps {
    onApiKeyClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onApiKeyClick }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-surface-200/80 transition-all">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center space-x-3 group cursor-default">
            <div className="p-2.5 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-md shadow-brand-200 group-hover:shadow-lg group-hover:shadow-brand-200 transition-all">
              <LogoIcon className="h-7 w-7 text-white sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-surface-900">
                Money<span className="text-brand-600">Radar</span>
              </h1>
              <p className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.15em] text-surface-400 -mt-0.5">Premium Financial Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {onApiKeyClick && (
                <button 
                    onClick={onApiKeyClick}
                    className="p-2.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                    title="Set API Key"
                >
                    <KeyIcon className="w-5 h-5" />
                </button>
            )}
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
