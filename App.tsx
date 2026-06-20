import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisSummary } from './components/AnalysisSummary';
import { ExpenseChart } from './components/ExpenseChart';
import { TransactionList } from './components/TransactionList';
import { Welcome } from './components/Welcome';
import { SampleFiles } from './components/SampleFiles';
import { Loader } from './components/Loader';
import { ErrorDisplay } from './components/ErrorDisplay';
import { MonthlyExpenseChart } from './components/MonthlyExpenseChart';
import { CategoryMapping } from './components/CategoryMapping';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AddRuleModal } from './components/AddRuleModal';
import { AnalysisLog } from './components/AnalysisLog';
import { DashboardFilters } from './components/DashboardFilters';
import { DuplicateTransactionModal } from './components/DuplicateTransactionModal';
import { PasswordModal } from './components/PasswordModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { fileToBase64, readFileAsText } from './utils/fileUtils';
import { checkAndDecryptPdf } from './utils/pdfUtils';
import { analyzeStatement } from './services/geminiService';
import { parseOffline } from './services/offlineParser';
import { parseImportedTransactions } from './utils/csvUtils';
import { AnalysisResult, CategorizationRule, FileContent, Transaction, ExpenseByCategory, MonthlyExpense, ViewType, AnalysisLogEntry } from './types';
import { v4 as uuidv4 } from 'uuid';
import { defaultRules } from './data/defaultRules';
import { applyRulesToTransactions } from './utils/categorize';
import { ChevronDownIcon } from './components/Icons';

const sanitizeCurrencyCode = (code: string | undefined | null, fallback: string): string => {
  return code?.trim().toUpperCase() || fallback;
};

export const App: React.FC = () => {
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [processingFile, setProcessingFile] = useState<string | null>(null);
    const [viewType, setViewType] = useState<ViewType>('expense');

    const [rules, setRules] = useState<CategorizationRule[]>([]);
    const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
    const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
    const [transactionForRule, setTransactionForRule] = useState<Transaction | null>(null);
    const [analysisLog, setAnalysisLog] = useState<AnalysisLogEntry[]>([]);

    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [activeCategories, setActiveCategories] = useState<string[]>([]);
    
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [duplicateGroups, setDuplicateGroups] = useState<Transaction[][]>([]);

    const [expenseViewExcludedCategories, setExpenseViewExcludedCategories] = useState<string[]>(['Income', 'Adjustment', 'Payment', 'CardPayment', 'Tax', 'Transfer', 'Investment']);
    const importFileRef = useRef<HTMLInputElement>(null);
    const chartsContainerRef = useRef<HTMLDivElement>(null);
    const [groupSmallSlices, setGroupSmallSlices] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('all');

    const [passwordPrompt, setPasswordPrompt] = useState<{
        fileName: string;
        error?: string;
        resolve: (password: string | null) => void;
    } | null>(null);

    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [isApiKeyDismissible, setIsApiKeyDismissible] = useState(true);

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        let envKey = '';
        try {
            envKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
        } catch (e) {
            // Ignore error if process is not defined (e.g., on GitHub Pages)
        }
        
        if (!storedKey && !envKey) {
            setIsApiKeyDismissible(false);
            setIsApiKeyModalOpen(true);
        }
    }, []);

    const handleSaveApiKey = (key: string) => {
        localStorage.setItem('gemini_api_key', key);
        setIsApiKeyModalOpen(false);
        setIsApiKeyDismissible(true);
    };

    useEffect(() => {
        try {
            const savedRules = localStorage.getItem('categorizationRules');
            if (savedRules) {
                setRules(JSON.parse(savedRules));
            } else {
                setRules(defaultRules);
            }
        } catch (e) {
            console.error("Failed to load rules from localStorage", e);
            setRules(defaultRules);
        }
    }, []);

    const saveRules = (newRules: CategorizationRule[]) => {
        setRules(newRules);
        try {
            localStorage.setItem('categorizationRules', JSON.stringify(newRules));
        } catch (e) {
            console.error("Failed to save rules to localStorage", e);
        }
    };

    const findDuplicateTransactions = (transactions: Transaction[]): Transaction[][] => {
        const transactionMap = new Map<string, Transaction[]>();
        transactions.forEach(tx => {
            const key = `${tx.date}|${tx.description.toLowerCase()}|${tx.amount}|${tx.bankName.toLowerCase()}`;
            if (!transactionMap.has(key)) {
                transactionMap.set(key, []);
            }
            transactionMap.get(key)!.push(tx);
        });
        
        return Array.from(transactionMap.values()).filter(group => group.length > 1);
    };

    const mergeAnalysisResults = (current: AnalysisResult | null, incoming: AnalysisResult): AnalysisResult => {
        if (!current) {
            return incoming;
        }

        const combinedTransactions = [...current.transactions, ...incoming.transactions];
        
        const totalIncome = combinedTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = Math.abs(combinedTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
        
        const expensesByCategoryMap = new Map<string, number>();
        const monthlyExpensesMap = new Map<string, Map<string, number>>();
        
        combinedTransactions.forEach(tx => {
            if (tx.amount < 0) {
                const month = tx.date.substring(0, 7);
                const category = tx.category;
                const amount = Math.abs(tx.amount);
                
                expensesByCategoryMap.set(category, (expensesByCategoryMap.get(category) || 0) + amount);

                if (!monthlyExpensesMap.has(month)) {
                    monthlyExpensesMap.set(month, new Map());
                }
                const monthMap = monthlyExpensesMap.get(month)!;
                monthMap.set(category, (monthMap.get(category) || 0) + amount);
            }
        });
        
        const expensesByCategory: ExpenseByCategory[] = Array.from(expensesByCategoryMap.entries()).map(([category, amount]) => ({ category, amount }));
        const monthlyExpensesByCategory: MonthlyExpense[] = Array.from(monthlyExpensesMap.entries()).map(([month, expensesMap]) => ({
            month,
            expenses: Array.from(expensesMap.entries()).map(([category, amount]) => ({ category, amount }))
        }));
        
        const bankNames = Array.from(new Set([...current.bankNames, ...incoming.bankNames]));
        
        return {
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
            transactions: combinedTransactions,
            expensesByCategory,
            monthlyExpensesByCategory,
            bankNames,
            currency: sanitizeCurrencyCode(incoming.currency, current.currency),
            statementCount: current.statementCount + 1,
        };
    };

    const recalculateSummaries = (transactions: Transaction[], currentCurrency: string): AnalysisResult => {
        const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));

        const expensesByCategoryMap = new Map<string, number>();
        const monthlyExpensesMap = new Map<string, Map<string, number>>();
        const bankNamesSet = new Set<string>();
        const statementCount = new Set(transactions.map(t => t.sourceFile)).size;
        
        transactions.forEach(tx => {
            bankNamesSet.add(tx.bankName);
            if (tx.amount < 0) {
                const month = tx.date.substring(0, 7);
                const category = tx.category;
                const amount = Math.abs(tx.amount);
                
                expensesByCategoryMap.set(category, (expensesByCategoryMap.get(category) || 0) + amount);

                if (!monthlyExpensesMap.has(month)) {
                    monthlyExpensesMap.set(month, new Map());
                }
                const monthMap = monthlyExpensesMap.get(month)!;
                monthMap.set(category, (monthMap.get(category) || 0) + amount);
            }
        });
        
        const expensesByCategory: ExpenseByCategory[] = Array.from(expensesByCategoryMap.entries()).map(([category, amount]) => ({ category, amount }));
        const monthlyExpensesByCategory: MonthlyExpense[] = Array.from(monthlyExpensesMap.entries()).map(([month, expensesMap]) => ({
            month,
            expenses: Array.from(expensesMap.entries()).map(([category, amount]) => ({ category, amount }))
        }));
        
        return {
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
            transactions: transactions,
            expensesByCategory,
            monthlyExpensesByCategory,
            bankNames: Array.from(bankNamesSet),
            currency: currentCurrency,
            statementCount: statementCount
        };
    };

    const handleFileUpload = useCallback(async (files: File[]) => {
        setIsLoading(true);
        setError(null);
        setProgress({ current: 0, total: files.length });
    
        const preparedFiles: { file: File, content: FileContent, startTime: Date }[] = [];
        let completedCount = 0;

        // Step 1: Prepare files sequentially (handles password prompts)
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            const startTime = new Date();
            setProcessingFile(`Preparing ${file.name}...`);
    
            try {
                if (file.type.includes('pdf')) {
                    let passwordError: string | undefined = undefined;
                    let isProcessed = false;
                    let currentPassword: string | undefined = undefined;
                    
                    while (!isProcessed) {
                        const { isEncrypted, decryptedFile, error } = await checkAndDecryptPdf(file, currentPassword);
                        
                        if (error) {
                            const password = await new Promise<string | null>((resolve) => {
                                setPasswordPrompt({ fileName: file.name, error: error, resolve });
                            });
                            
                            if (password === null) {
                                throw new Error("File skipped by user.");
                            }
                            currentPassword = password;
                        } else if (decryptedFile) {
                            file = decryptedFile;
                            isProcessed = true;
                        } else {
                            isProcessed = true;
                        }
                    }
                }

                let content: FileContent;
                if (file.type === 'text/csv' || file.type === 'text/plain') {
                    content = { type: 'text', data: await readFileAsText(file) };
                } else if (file.type.startsWith('image/') || file.type.includes('pdf') || file.type.includes('spreadsheet') || file.type.includes('excel')) {
                    const [base64, mimeType] = await fileToBase64(file);
                    content = { type: 'file', data: base64, mimeType };
                } else {
                    throw new Error(`Unsupported file type: ${file.type}`);
                }
    
                preparedFiles.push({ file, content, startTime });
            } catch (err: any) {
                console.error(`Failed to prepare file ${file.name}:`, err);
                const errorMessage = err.message || 'An unknown error occurred.';
                
                if (errorMessage !== "File skipped by user.") {
                    setError(`Failed to process file ${file.name}: ${errorMessage}`);
                }

                const endTime = new Date();
                const logEntry: AnalysisLogEntry = {
                    id: uuidv4(),
                    fileName: file.name,
                    status: errorMessage === "File skipped by user." ? 'Skipped' : 'Error',
                    totalTransactions: 0,
                    creditCount: 0, creditAmount: 0, debitCount: 0, debitAmount: 0,
                    startTime,
                    endTime,
                    durationSeconds: parseFloat(((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)),
                    message: errorMessage
                };
                setAnalysisLog(prev => [...prev, logEntry]);
                completedCount++;
                setProgress(prev => ({ ...prev, current: completedCount }));
            }
        }

        // Step 2: Analyze prepared files concurrently in batches
        if (preparedFiles.length > 0) {
            setProcessingFile(`Analyzing ${preparedFiles.length} file(s)...`);
            
            const concurrencyLimit = 3;
            for (let i = 0; i < preparedFiles.length; i += concurrencyLimit) {
                const batch = preparedFiles.slice(i, i + concurrencyLimit);
                
                await Promise.all(batch.map(async ({ file, content, startTime }) => {
                    try {
                        const { result, usage } = await analyzeStatement(content, rules, file.name);

                        result.transactions = applyRulesToTransactions(result.transactions, rules);
            
                        setAnalysisResult(current => mergeAnalysisResults(current, result));
            
                        const endTime = new Date();
                        const logEntry: AnalysisLogEntry = {
                            id: uuidv4(),
                            fileName: file.name,
                            status: 'Success',
                            totalTransactions: result.transactions.length,
                            creditCount: result.transactions.filter(t => t.amount > 0).length,
                            creditAmount: result.totalIncome,
                            debitCount: result.transactions.filter(t => t.amount < 0).length,
                            debitAmount: result.totalExpenses,
                            startTime,
                            endTime,
                            durationSeconds: parseFloat(((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)),
                            message: `${result.transactions.length} transactions found.`,
                            usage,
                        };
                        setAnalysisLog(prev => [...prev, logEntry]);
            
                    } catch (err: any) {
                        console.error(`Failed to analyze file ${file.name}:`, err);
                        const errorMessage = err.message || 'An unknown error occurred.';

                        let offlineResult: AnalysisResult | null = null;
                        const isApiOrNetworkError =
                          errorMessage.toLowerCase().includes('api key') ||
                          errorMessage.toLowerCase().includes('network') ||
                          errorMessage.toLowerCase().includes('fetch') ||
                          errorMessage.toLowerCase().includes('overloaded') ||
                          errorMessage.toLowerCase().includes('too many requests');

                        if (isApiOrNetworkError && content.type === 'text') {
                          try {
                            offlineResult = await parseOffline(content, rules, file.name);
                            offlineResult.transactions = applyRulesToTransactions(offlineResult.transactions, rules);
                            setAnalysisResult(current => mergeAnalysisResults(current, offlineResult));
                          } catch (offlineErr: any) {
                            console.error('Offline parser also failed:', offlineErr);
                          }
                        }
                        
                        if (offlineResult) {
                          const endTime = new Date();
                          const logEntry: AnalysisLogEntry = {
                            id: uuidv4(),
                            fileName: file.name,
                            status: 'Success',
                            totalTransactions: offlineResult.transactions.length,
                            creditCount: offlineResult.transactions.filter(t => t.amount > 0).length,
                            creditAmount: offlineResult.totalIncome,
                            debitCount: offlineResult.transactions.filter(t => t.amount < 0).length,
                            debitAmount: offlineResult.totalExpenses,
                            startTime,
                            endTime,
                            durationSeconds: parseFloat(((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)),
                            message: `${offlineResult.transactions.length} transactions found via offline parser.`,
                          };
                          setAnalysisLog(prev => [...prev, logEntry]);
                          setError(`Gemini analysis unavailable for "${file.name}". Used offline parser instead.`);
                        } else {
                          setError(`Failed to analyze file ${file.name}: ${errorMessage}`);
                          const endTime = new Date();
                          const logEntry: AnalysisLogEntry = {
                            id: uuidv4(),
                            fileName: file.name,
                            status: 'Error',
                            totalTransactions: 0,
                            creditCount: 0, creditAmount: 0, debitCount: 0, debitAmount: 0,
                            startTime,
                            endTime,
                            durationSeconds: parseFloat(((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)),
                            message: errorMessage,
                          };
                          setAnalysisLog(prev => [...prev, logEntry]);
                        }
                    } finally {
                        completedCount++;
                        setProgress(prev => ({ ...prev, current: completedCount }));
                    }
                }));
            }
        }
        
        setIsLoading(false);
        setProcessingFile(null);
    }, [rules]);

    useEffect(() => {
        if (analysisResult) {
            const duplicates = findDuplicateTransactions(analysisResult.transactions);
            if(duplicates.length > 0) {
                setDuplicateGroups(duplicates);
                setIsDuplicateModalOpen(true);
            }
        }
    }, [analysisResult?.transactions.length]);


    const handleAddRule = (rule: CategorizationRule) => {
        const newRules = [...rules, rule];
        saveRules(newRules);
        // Re-categorize transactions with new rules
        if(analysisResult) {
            const updatedTransactions = applyRulesToTransactions(analysisResult.transactions, newRules);
            setAnalysisResult(recalculateSummaries(updatedTransactions, analysisResult.currency));
        }
    };
    
    const handleRemoveRule = (index: number) => {
        const newRules = rules.filter((_, i) => i !== index);
        saveRules(newRules);
        if(analysisResult) {
            const updatedTransactions = applyRulesToTransactions(analysisResult.transactions, newRules);
            setAnalysisResult(recalculateSummaries(updatedTransactions, analysisResult.currency));
        }
    };

    const handleUpdateRule = (index: number, rule: CategorizationRule) => {
        const newRules = [...rules];
        newRules[index] = rule;
        saveRules(newRules);
         if(analysisResult) {
            const updatedTransactions = applyRulesToTransactions(analysisResult.transactions, newRules);
            setAnalysisResult(recalculateSummaries(updatedTransactions, analysisResult.currency));
        }
    };

    const handleSetRules = (newRules: CategorizationRule[]) => {
        saveRules(newRules);
        if (analysisResult) {
            const updatedTransactions = applyRulesToTransactions(analysisResult.transactions, newRules);
            setAnalysisResult(recalculateSummaries(updatedTransactions, analysisResult.currency));
        }
    };

    const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'sourceFile'>) => {
        if (analysisResult) {
            const fullTx: Transaction = {
                ...newTx,
                id: uuidv4(),
                sourceFile: 'Manual Entry',
                isManuallyEdited: true,
            };
            const updatedTransactions = [...analysisResult.transactions, fullTx];
            setAnalysisResult(recalculateSummaries(updatedTransactions, analysisResult.currency));
        }
        setIsAddTransactionModalOpen(false);
    };

    const handleUpdateTransaction = (updatedTx: Transaction) => {
        if (analysisResult) {
            const updatedTransactions = analysisResult.transactions.map(tx => 
                tx.id === updatedTx.id ? { ...updatedTx, isManuallyEdited: true } : tx
            );
            setAnalysisResult(recalculateSummaries(updatedTransactions, analysisResult.currency));
        }
    };

    const handleDeleteTransaction = (id: string) => {
        if (analysisResult) {
            const updatedTransactions = analysisResult.transactions.filter(tx => tx.id !== id);
            setAnalysisResult(recalculateSummaries(updatedTransactions, analysisResult.currency));
        }
    };
    
    const handleBulkUpdateCategory = (ids: string[], category: string) => {
        if(analysisResult && category) {
            const updatedTransactions = analysisResult.transactions.map(tx => 
                ids.includes(tx.id) ? { ...tx, category, isManuallyEdited: true } : tx
            );
             setAnalysisResult(recalculateSummaries(updatedTransactions, analysisResult.currency));
        }
    };
    
    const handleAddRuleFromTransaction = (transaction: Transaction) => {
        setTransactionForRule(transaction);
        setIsAddRuleModalOpen(true);
    };

    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const content = await readFileAsText(file);
            const importedTransactions = parseImportedTransactions(content, file.name);
            const importedResult: AnalysisResult = recalculateSummaries(importedTransactions, 'INR'); // Assume INR for now
            
            setAnalysisResult(current => mergeAnalysisResults(current, importedResult));
            
            const logEntry: AnalysisLogEntry = {
                id: uuidv4(),
                fileName: file.name,
                status: 'Success',
                totalTransactions: importedResult.transactions.length,
                creditCount: importedResult.transactions.filter(t => t.amount > 0).length,
                creditAmount: importedResult.totalIncome,
                debitCount: importedResult.transactions.filter(t => t.amount < 0).length,
                debitAmount: importedResult.totalExpenses,
                startTime: new Date(),
                endTime: new Date(),
                durationSeconds: 0.1,
                message: `${importedResult.transactions.length} transactions imported.`
            };
            setAnalysisLog(prev => [...prev, logEntry]);

        } catch (err: any) {
            setError(err.message || 'Failed to import file.');
        } finally {
            setIsLoading(false);
            e.target.value = ''; // Reset file input
        }
    };

    const handleDeleteDuplicates = (idsToDelete: string[]) => {
        if (analysisResult) {
            const updatedTransactions = analysisResult.transactions.filter(tx => !idsToDelete.includes(tx.id));
            setAnalysisResult(recalculateSummaries(updatedTransactions, analysisResult.currency));
            setDuplicateGroups([]);
        }
        setIsDuplicateModalOpen(false);
    };

    const handleClearLog = () => {
        setAnalysisLog([]);
    };
    
    const handleStartOver = () => {
        setAnalysisResult(null);
        setAnalysisLog([]);
        setError(null);
    };

    const handleRemoveFile = (fileName: string) => {
        if (analysisResult) {
            const updatedTransactions = analysisResult.transactions.filter(tx => tx.sourceFile !== fileName);
            setAnalysisResult(recalculateSummaries(updatedTransactions, analysisResult.currency));
            setAnalysisLog(prev => prev.filter(log => log.fileName !== fileName));
        }
    };
    

    const { filteredTransactions, filteredMonthlyExpenses, dateBounds, allPossibleCategories } = useMemo(() => {
        if (!analysisResult) {
            return { filteredTransactions: [], filteredMonthlyExpenses: [], dateBounds: { min: '', max: '' }, allPossibleCategories: [] };
        }
        const categories = new Set<string>();
        analysisResult.transactions.forEach(tx => categories.add(tx.category));
        const allCats = Array.from(categories).sort();
        
        let txs = analysisResult.transactions;
        if (viewType === 'expense') {
            txs = txs.filter(tx => !expenseViewExcludedCategories.includes(tx.category));
        }

        const dates = txs.map(tx => tx.date);
        const bounds = {
            min: dates.length > 0 ? dates.reduce((a, b) => a < b ? a : b) : '',
            max: dates.length > 0 ? dates.reduce((a, b) => a > b ? a : b) : ''
        };

        if (dateRange.start) {
            txs = txs.filter(tx => tx.date >= dateRange.start);
        }
        if (dateRange.end) {
            txs = txs.filter(tx => tx.date <= dateRange.end);
        }

        // We need to recalculate monthly expenses based on the filtered transactions
        const monthlyMap = new Map<string, Map<string, number>>();
        txs.forEach(tx => {
            if (tx.amount < 0) {
                const month = tx.date.substring(0, 7);
                if (!monthlyMap.has(month)) {
                    monthlyMap.set(month, new Map());
                }
                const monthExpenses = monthlyMap.get(month)!;
                monthExpenses.set(tx.category, (monthExpenses.get(tx.category) || 0) + Math.abs(tx.amount));
            }
        });

        const monthlyExpenses: MonthlyExpense[] = Array.from(monthlyMap.entries()).map(([month, expensesMap]) => ({
            month,
            expenses: Array.from(expensesMap.entries()).map(([category, amount]) => ({ category, amount }))
        })).sort((a,b) => a.month.localeCompare(b.month));

        return { filteredTransactions: txs, filteredMonthlyExpenses: monthlyExpenses, dateBounds: bounds, allPossibleCategories: allCats };
    }, [analysisResult, viewType, expenseViewExcludedCategories, dateRange]);


    const filteredSummary = useMemo(() => {
        if (!analysisResult) return null;
        return recalculateSummaries(filteredTransactions, analysisResult.currency);
    }, [filteredTransactions, analysisResult?.currency]);

    const smallCategorySet = useMemo(() => {
        if (!filteredSummary) return new Set<string>();
        const totalExpenses = filteredSummary.totalExpenses;
        if (totalExpenses === 0) return new Set<string>();
        
        const MIN_PERCENT_FOR_SLICE = 0.03;
        const smallCats = new Set<string>();
        filteredSummary.expensesByCategory.forEach(cat => {
            if ((cat.amount / totalExpenses) < MIN_PERCENT_FOR_SLICE) {
                smallCats.add(cat.category);
            }
        });
        return smallCats;
    }, [filteredSummary]);

    useEffect(() => {
        // When the data or filters change, update the active categories for the charts
        if (filteredSummary) {
            const allCats = filteredSummary.expensesByCategory.map(e => e.category).sort();
            setActiveCategories(allCats);
        }
    }, [filteredSummary]);
    
    const handleCategoryToggle = (category: string) => {
        setActiveCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    return (
        <div className="min-h-screen bg-surface-50">
            <Header 
                onApiKeyClick={() => {
                    setIsApiKeyDismissible(true);
                    setIsApiKeyModalOpen(true);
                }}
            />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl fade-in space-y-6">
                {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
                
                <>
                        {!analysisResult ? (
                            <>
                                {isLoading && <Loader progress={progress} processingFile={processingFile} />}
                                <SampleFiles onFileUpload={handleFileUpload} disabled={isLoading} />
                                <Welcome onFileUpload={handleFileUpload} onImportClick={handleImportClick} isLoading={isLoading} />
                            </>
                        ) : (
                            <div>
                                <details className="w-full bg-white rounded-2xl shadow-card border border-surface-200 group">
                                    <summary className="p-4 flex justify-between items-center cursor-pointer list-none">
                                        <h2 className="font-bold text-xl text-surface-900">
                                            Upload More Statements
                                        </h2>
                                        <ChevronDownIcon className="h-6 w-6 text-surface-400 transition-transform duration-200 group-open:rotate-180" />
                                    </summary>
                                    <div className="p-4 border-t border-surface-200">
                                        <FileUpload onFileUpload={handleFileUpload} disabled={isLoading} />
                                        {isLoading && <Loader progress={progress} processingFile={processingFile} />}
                                    </div>
                                </details>

                                <SampleFiles onFileUpload={handleFileUpload} disabled={isLoading} />

                                <details className="w-full bg-white rounded-2xl shadow-card border border-surface-200 group" open>
                                    <summary className="p-4 flex justify-between items-center cursor-pointer list-none">
                                        <h2 className="font-bold text-xl text-surface-900">
                                            Financial Summary
                                        </h2>
                                        <ChevronDownIcon className="h-6 w-6 text-surface-400 transition-transform duration-200 group-open:rotate-180" />
                                    </summary>
                                    <AnalysisSummary
                                        summary={analysisResult}
                                        duplicateCount={duplicateGroups.length}
                                        onReviewDuplicates={() => setIsDuplicateModalOpen(true)}
                                    />
                                </details>
                                
                                <DashboardFilters
                                    dateRange={dateRange}
                                    setDateRange={setDateRange}
                                    viewType={viewType}
                                    setViewType={setViewType}
                                    dateBounds={dateBounds}
                                    allPossibleCategories={allPossibleCategories}
                                    expenseViewExcludedCategories={expenseViewExcludedCategories}
                                    setExpenseViewExcludedCategories={setExpenseViewExcludedCategories}
                                    chartsContainerRef={chartsContainerRef}
                                    groupSmallSlices={groupSmallSlices}
                                    setGroupSmallSlices={setGroupSmallSlices}
                                    selectedMonth={selectedMonth}
                                    setSelectedMonth={setSelectedMonth}
                                    monthlyDataForFilter={filteredMonthlyExpenses}
                                />

                                {filteredSummary && (
                                    <div ref={chartsContainerRef} className="grid lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-1">
                                            <ExpenseChart 
                                                data={filteredSummary.expensesByCategory}
                                                monthlyData={filteredMonthlyExpenses}
                                                currency={filteredSummary.currency} 
                                                activeCategories={activeCategories}
                                                onCategoryToggle={handleCategoryToggle}
                                                groupSmallSlices={groupSmallSlices}
                                                smallCategorySet={smallCategorySet}
                                                selectedMonth={selectedMonth}
                                            />
                                        </div>
                                        <div className="lg:col-span-2">
                                            <MonthlyExpenseChart 
                                                data={filteredMonthlyExpenses} 
                                                currency={filteredSummary.currency}
                                                activeCategories={activeCategories}
                                                onCategoryToggle={handleCategoryToggle}
                                                groupSmallSlices={groupSmallSlices}
                                                smallCategorySet={smallCategorySet}
                                            />
                                        </div>
                                    </div>
                                )}
                            
                                <CategoryMapping 
                                    rules={rules} 
                                    onAddRule={handleAddRule} 
                                    onRemoveRule={handleRemoveRule} 
                                    onUpdateRule={handleUpdateRule}
                                    onSetRules={handleSetRules}
                                />
                                
                                <TransactionList
                                    transactions={filteredTransactions}
                                    monthlyExpensesByCategory={filteredMonthlyExpenses}
                                    currency={analysisResult.currency}
                                    rules={rules}
                                    allPossibleCategories={allPossibleCategories}
                                    onAddTransaction={() => setIsAddTransactionModalOpen(true)}
                                    onUpdateTransaction={handleUpdateTransaction}
                                    onDeleteTransaction={handleDeleteTransaction}
                                    onImportClick={handleImportClick}
                                    onAddRuleFromTransaction={handleAddRuleFromTransaction}
                                    onBulkUpdateCategory={handleBulkUpdateCategory}
                                />

                                <AnalysisLog 
                                    logs={analysisLog}
                                    onClear={handleClearLog}
                                    onReset={handleStartOver}
                                    isLoading={isLoading}
                                    progress={progress}
                                    processingFile={processingFile}
                                    onRemoveFile={handleRemoveFile}
                                />
                            </div>
                        )}
                        {/* Hidden file input for imports */}
                        <input type="file" ref={importFileRef} onChange={handleImportFile} className="hidden" accept=".csv,.json" />

                        {/* Modals */}
                        <AddTransactionModal 
                            isOpen={isAddTransactionModalOpen} 
                            onClose={() => setIsAddTransactionModalOpen(false)}
                            onSave={handleAddTransaction}
                            rules={rules}
                            currency={analysisResult?.currency || 'INR'}
                        />
                        <AddRuleModal
                            isOpen={isAddRuleModalOpen}
                            onClose={() => setIsAddRuleModalOpen(false)}
                            onSave={(rule) => { handleAddRule(rule); setIsAddRuleModalOpen(false); }}
                            transaction={transactionForRule}
                            allPossibleCategories={allPossibleCategories}
                        />
                        <DuplicateTransactionModal
                            isOpen={isDuplicateModalOpen}
                            onClose={() => setIsDuplicateModalOpen(false)}
                            duplicateGroups={duplicateGroups}
                            onDelete={handleDeleteDuplicates}
                            currency={analysisResult?.currency || 'INR'}
                        />
                        {passwordPrompt && (
                            <PasswordModal
                                fileName={passwordPrompt.fileName}
                                error={passwordPrompt.error}
                                onSubmit={(password) => {
                                    passwordPrompt.resolve(password);
                                    setPasswordPrompt(null);
                                }}
                            />
                        )}
                        <ApiKeyModal
                            isOpen={isApiKeyModalOpen}
                            onSave={handleSaveApiKey}
                            onClose={isApiKeyDismissible ? () => setIsApiKeyModalOpen(false) : undefined}
                            isDismissible={isApiKeyDismissible}
                        />
                    </>
            </main>
        </div>
    );
};