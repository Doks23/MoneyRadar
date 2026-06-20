import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/helpers';
import { DeleteIcon } from './Icons';

interface DuplicateTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    duplicateGroups: Transaction[][];
    onDelete: (idsToDelete: string[]) => void;
    currency: string;
}

export const DuplicateTransactionModal: React.FC<DuplicateTransactionModalProps> = ({
    isOpen,
    onClose,
    duplicateGroups,
    onDelete,
    currency
}) => {
    const [keepers, setKeepers] = useState<Record<number, string>>({});

    useEffect(() => {
        if (isOpen && duplicateGroups.length > 0) {
            const initialKeepers: Record<number, string> = {};
            duplicateGroups.forEach((group, index) => {
                if (group.length > 0) {
                    initialKeepers[index] = group[0].id;
                }
            });
            setKeepers(initialKeepers);
        }
    }, [isOpen, duplicateGroups]);

    if (!isOpen) return null;

    const handleSelectKeeper = (groupIndex: number, transactionId: string) => {
        setKeepers(prev => ({ ...prev, [groupIndex]: transactionId }));
    };
    
    const handleDelete = () => {
        const keeperIds = new Set<string>(Object.values(keepers));
        const allDuplicateIds = duplicateGroups.flat().map(tx => tx.id);
        const idsToDelete = allDuplicateIds.filter(id => !keeperIds.has(id));
        
        onDelete(idsToDelete);
    };
    
    const totalTransactionsInGroups = duplicateGroups.flat().length;
    const totalGroups = duplicateGroups.length;
    const totalToDelete = totalTransactionsInGroups - totalGroups;

    return (
        <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-premium p-6 w-full max-w-3xl flex flex-col max-h-[90vh] animate-scale-in">
                <div className="flex-shrink-0">
                    <h2 className="text-xl font-display font-bold text-surface-900 mb-2">Review Duplicates</h2>
                    <p className="text-surface-500 mb-4 text-sm">Select the transaction you want to <span className="font-bold text-positive-600">keep</span> from each group. The others will be deleted.</p>
                </div>
                
                <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                    {duplicateGroups.map((group, index) => (
                        <div key={index} className="bg-surface-50 border border-surface-200 rounded-xl p-4">
                            <div className="border-b border-surface-200 pb-3 mb-3">
                                <p className="font-semibold text-surface-800 text-sm">{group[0].description}</p>
                                <div className="flex justify-between text-sm text-surface-500 mt-1">
                                    <span>{group[0].date}</span>
                                    <span className={`font-bold ${group[0].amount < 0 ? 'text-negative-600' : 'text-positive-600'}`}>
                                        {formatCurrency(group[0].amount, currency)}
                                    </span>
                                    <span>{group[0].bankName}</span>
                                </div>
                            </div>
                            <ul className="space-y-1">
                                {group.map(tx => (
                                    <li key={tx.id} className="flex items-center p-2 rounded-lg hover:bg-white transition-colors">
                                        <label className="flex items-center w-full cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`keeper-group-${index}`}
                                                checked={keepers[index] === tx.id}
                                                onChange={() => handleSelectKeeper(index, tx.id)}
                                                className="h-4 w-4 border-surface-300 text-brand-600 focus:ring-brand-500"
                                            />
                                            <span className="ml-3 text-sm text-surface-600">
                                                From: <span className="font-medium">{tx.sourceFile}</span>
                                            </span>
                                            <span className="ml-auto text-[10px] text-surface-400 font-mono">ID: {tx.id.substring(0, 8)}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex-shrink-0 flex justify-between items-center pt-6 mt-4 border-t border-surface-200">
                     <button type="button" onClick={onClose} className="bg-surface-100 text-surface-700 font-bold py-2.5 px-5 rounded-xl hover:bg-surface-200 transition-all text-sm">
                        Keep All
                    </button>
                    <button 
                        type="button" 
                        onClick={handleDelete}
                        disabled={totalToDelete <= 0}
                        className="bg-negative-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-negative-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-negative-200 text-sm"
                    >
                        <DeleteIcon className="h-5 w-5" />
                        Delete Others ({totalToDelete})
                    </button>
                </div>
            </div>
        </div>
    );
};
