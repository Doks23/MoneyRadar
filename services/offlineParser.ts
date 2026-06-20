import { v4 as uuidv4 } from 'uuid';
import { AnalysisResult, CategorizationRule, FileContent, Transaction } from '../types';
import { extractRawText, parseTransactions, FuzzyCategor, extractBankName } from '../utils/statementParser';

export const parseOffline = async (
  content: FileContent,
  rules: CategorizationRule[],
  fileName: string
): Promise<AnalysisResult> => {
  const text = content.type === 'text' ? content.data : '';
  if (!text) {
    throw new Error('Offline parser requires text input. File may be image-only.');
  }

  const cleanedText = text;
  const parsed = parseTransactions(cleanedText);

  if (parsed.length === 0) {
    throw new Error('No transactions could be extracted from the file using the offline parser.');
  }

  const fuzzyRules = rules.map(r => ({
    pattern: new RegExp(r.keyword, 'i'),
    category: r.category,
  }));
  const categorizer = new FuzzyCategor(fuzzyRules);

  const transactions: Transaction[] = [];
  let totalIncome = 0;
  let totalExpenses = 0;
  const bankName = extractBankName(cleanedText);

  for (const ptx of parsed) {
    const amount = ptx.type === 'credit' ? Math.abs(ptx.amount) : -Math.abs(ptx.amount);
    const { category } = categorizer.categorize(ptx.description, ptx.type);

    const tx: Transaction = {
      id: uuidv4(),
      date: ptx.date,
      description: ptx.description,
      amount,
      category: category || (ptx.type === 'credit' ? 'Income' : 'Misc'),
      bankName,
      currency: 'INR',
      sourceFile: fileName,
    };

    transactions.push(tx);

    if (amount > 0) {
      totalIncome += amount;
    } else {
      totalExpenses += Math.abs(amount);
    }
  }

  const expensesByCategoryMap = new Map<string, number>();
  const monthlyExpensesMap = new Map<string, Map<string, number>>();

  for (const tx of transactions) {
    if (tx.amount < 0) {
      const month = tx.date.substring(0, 7);
      const cat = tx.category;
      const amt = Math.abs(tx.amount);
      expensesByCategoryMap.set(cat, (expensesByCategoryMap.get(cat) || 0) + amt);
      if (!monthlyExpensesMap.has(month)) {
        monthlyExpensesMap.set(month, new Map());
      }
      const mm = monthlyExpensesMap.get(month)!;
      mm.set(cat, (mm.get(cat) || 0) + amt);
    }
  }

  const expensesByCategory = Array.from(expensesByCategoryMap.entries()).map(([category, amount]) => ({ category, amount }));
  const monthlyExpensesByCategory = Array.from(monthlyExpensesMap.entries()).map(([month, expensesMap]) => ({
    month,
    expenses: Array.from(expensesMap.entries()).map(([category, amount]) => ({ category, amount })),
  }));

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactions,
    expensesByCategory,
    monthlyExpensesByCategory,
    bankNames: [bankName],
    currency: 'INR',
    statementCount: 1,
  };
};
