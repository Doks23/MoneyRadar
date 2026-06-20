import React, { useState, useEffect, useRef } from 'react';

interface PasswordModalProps {
    fileName: string;
    onSubmit: (password: string | null) => void;
    error?: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ fileName, onSubmit, error }) => {
    const [password, setPassword] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-premium max-w-md w-full p-6 animate-scale-in">
                <h3 className="text-xl font-display font-bold text-surface-900 mb-2">Password Required</h3>
                <p className="text-surface-500 mb-4 text-sm">
                    The file <span className="font-semibold text-surface-700">{fileName}</span> is protected. Enter the password to analyze it.
                </p>
                {error && <p className="text-negative-600 text-sm mb-4 font-medium bg-negative-50 p-2 rounded-lg">{error}</p>}
                <input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none mb-6 transition-all text-sm"
                    placeholder="Enter password"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onSubmit(password);
                        if (e.key === 'Escape') onSubmit(null);
                    }}
                />
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => onSubmit(null)}
                        className="px-4 py-2.5 text-surface-600 hover:bg-surface-100 rounded-xl font-semibold transition-colors text-sm"
                    >
                        Skip File
                    </button>
                    <button
                        onClick={() => onSubmit(password)}
                        className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors shadow-md shadow-brand-200 text-sm"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};
