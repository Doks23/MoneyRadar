import React from 'react';
import { LogoIcon, KeyIcon, SettingsIcon, ProfileIcon } from './Icons';

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
              <p className="hidden sm:block text-xs text-surface-400 -mt-0.5">Personal finance statement analyzer</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {onApiKeyClick && (
                <button 
                    onClick={onApiKeyClick}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-surface-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                >
                    <KeyIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">AI Key</span>
                </button>
            )}
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-all">
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-all cursor-pointer">
                <ProfileIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
