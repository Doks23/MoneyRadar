import { v4 as uuidv4 } from 'uuid';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  bankName: string;
  currency: string;
  sourceFile: string;
  isManuallyEdited?: boolean;
}

export interface ExpenseByCategory {
    category: string;
    amount: number;
}

export interface MonthlyExpense {
    month: string; // YYYY-MM
    expenses: ExpenseByCategory[];
}

export interface AnalysisResult {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactions: Transaction[];
  expensesByCategory: ExpenseByCategory[];
  monthlyExpensesByCategory: MonthlyExpense[];
  bankNames: string[];
  currency: string;
  statementCount: number;
}

export interface CategorizationRule {
  keyword: string;
  category: string;
}

export type FileContent = 
  | { type: 'text'; data: string }
  | { type: 'file'; data: string; mimeType: string }
  | { type: 'files'; data: { data: string; mimeType: string }[] };

export type ViewType = 'expense' | 'full';

export interface AnalysisLogEntry {
  id: string;
  fileName: string;
  status: 'Success' | 'Error' | 'Skipped';
  totalTransactions: number;
  creditCount: number;
  creditAmount: number;
  debitCount: number;
  debitAmount: number;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  message: string;
  usage?: {
    promptTokens: number;
    outputTokens: number;
    totalTokens: number;
    costInr: number;
  };
}

export interface ModelPricing {
  inputPer1KTokens: number;
  outputPer1KTokens: number;
}

export type LLMProvider = 'google' | 'openai' | 'anthropic';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
}

export const PROVIDER_MODELS: Record<LLMProvider, { label: string; value: string }[]> = {
  google: [
    { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
    { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
    { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
  ],
  openai: [
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
  ],
  anthropic: [
    { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
    { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
    { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
  ],
};