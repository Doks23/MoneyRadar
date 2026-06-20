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