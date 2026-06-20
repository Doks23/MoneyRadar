import React, { useState, useEffect } from 'react';
import { KeyIcon } from './Icons';
import { LLMConfig } from '../types';

interface ApiKeyModalProps {
    isOpen: boolean;
    onSave: (key: string) => void;
    onClose?: () => void;
    isDismissible?: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
    google: 'Google Gemini',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
};

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose, isDismissible = true }) => {
    const [key, setKey] = useState('');
    const [config, setConfig] = useState<LLMConfig | null>(null);

    useEffect(() => {
        if (isOpen) {
            const stored = localStorage.getItem('llm_config');
            if (stored) {
                try {
                    const cfg = JSON.parse(stored) as LLMConfig;
                    setConfig(cfg);
                    setKey(cfg.apiKey);
                } catch { setKey(''); }
            } else {
                const storedKey = localStorage.getItem('gemini_api_key');
                if (storedKey) { setKey(storedKey); }
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
                <h2 className="text-xl font-display font-bold text-surface-900 mb-2">
                    {config ? PROVIDER_LABELS[config.provider] || config.provider : 'Gemini'} API Key
                </h2>
                {config && (
                    <p className="text-surface-400 text-xs mb-3">
                        Provider: {PROVIDER_LABELS[config.provider] || config.provider} &middot; Model: {config.model}
                    </p>
                )}
                <p className="text-surface-500 mb-4 text-sm leading-relaxed">
                    Your key is stored locally in your browser and is never sent to our servers.
                </p>
                <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder={config?.provider === 'google' ? 'AIzaSy...' : 'sk-...'}
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
