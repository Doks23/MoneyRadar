import React, { useState } from 'react';
import { LogoIcon, KeyIcon, ShieldIcon } from './Icons';
import { LLMProvider, PROVIDER_MODELS } from '../types';

interface SetupScreenProps {
  onComplete: () => void;
}

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  google: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

const PROVIDER_DOCS: Record<LLMProvider, string> = {
  google: 'https://aistudio.google.com/apikey',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
};

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [provider, setProvider] = useState<LLMProvider>('google');
  const [model, setModel] = useState(PROVIDER_MODELS.google[0].value);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const currentModels = PROVIDER_MODELS[provider];

  const handleProviderChange = (p: LLMProvider) => {
    setProvider(p);
    setModel(PROVIDER_MODELS[p][0].value);
  };

  const handleSave = () => {
    if (!apiKey.trim()) return;
    const config = { provider, model, apiKey: apiKey.trim() };
    localStorage.setItem('llm_config', JSON.stringify(config));
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-100 rounded-full blur-3xl opacity-30 translate-x-1/3 translate-y-1/3" />

      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="bg-white rounded-2xl shadow-premium border border-surface-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-lg shadow-brand-200 mb-4">
              <LogoIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-surface-900">
              Money<span className="text-brand-600">Radar</span>
            </h1>
            <p className="text-sm text-surface-400 mt-1">Configure your AI provider to get started</p>
          </div>

          <div className="space-y-5">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">AI Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(PROVIDER_LABELS) as [LLMProvider, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleProviderChange(key)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      provider === key
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-surface-200 bg-white text-surface-500 hover:border-surface-300 hover:bg-surface-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm transition-all appearance-none cursor-pointer"
              >
                {currentModels.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === 'google' ? 'AIzaSy...' : provider === 'openai' ? 'sk-proj-...' : 'sk-ant-...'}
                  className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm transition-all pr-10"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showKey ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
              <a
                href={PROVIDER_DOCS[provider]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Get an API key &rarr;
              </a>
            </div>

            {/* Privacy Notice */}
            <div className="flex items-start gap-3 p-4 bg-surface-50 rounded-xl border border-surface-200">
              <ShieldIcon className="w-5 h-5 text-positive-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-surface-700">Your key stays private</p>
                <p className="text-xs text-surface-400 leading-relaxed mt-0.5">
                  API keys are stored in your browser's local storage and are only used to communicate directly with the AI provider. They are never sent to any third party.
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-200"
            >
              <div className="flex items-center justify-center gap-2">
                <KeyIcon className="w-4 h-4" />
                Get Started
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
