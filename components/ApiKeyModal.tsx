import React, { useState, useEffect } from 'react';
import { KeyIcon } from './Icons';

interface ApiKeyModalProps {
    isOpen: boolean;
    onSave: (key: string) => void;
    onClose?: () => void;
    isDismissible?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose, isDismissible = true }) => {
    const [key, setKey] = useState('');

    useEffect(() => {
        if (isOpen) {
            const storedKey = localStorage.getItem('gemini_api_key');
            if (storedKey) {
                setKey(storedKey);
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-premium p-6 w-full max-w-md animate-scale-in">
                <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-4">
                    <KeyIcon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-display font-bold text-surface-900 mb-2">Gemini API Key</h2>
                <p className="text-surface-500 mb-4 text-sm leading-relaxed">
                    To analyze your statements, please provide your Gemini API key. Your key is stored locally in your browser and is never sent to our servers.
                </p>
                <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm transition-all"
                />
                <div className="flex justify-end gap-3 mt-6">
                    {isDismissible && onClose && (
                        <button onClick={onClose} className="px-4 py-2.5 text-surface-600 hover:bg-surface-100 rounded-xl font-semibold transition-colors text-sm">
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={() => onSave(key)}
                        disabled={!key.trim()}
                        className="px-4 py-2.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-200 text-sm"
                    >
                        Save Key
                    </button>
                </div>
            </div>
        </div>
    );
};
