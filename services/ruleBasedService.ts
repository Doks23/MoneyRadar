import { extractRawText, parseTransactions, FuzzyCategor, ParsedTransaction, extractBankName } from '../utils/statementParser';
import { AnalysisResult, Transaction, CategorizationRule } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function processStatementRuleBased(
  file: File,
  rules: CategorizationRule[],
  fileName: string
): Promise<AnalysisResult> {
  // Extract text
  const { text, format, confidence } = await extractRawText(file);
  
  // Extract bank name
  const bankName = extractBankName(text);

  // Parse transactions
  const parsedTransactions = parseTransactions(text);
  
  // Convert rules to FuzzyCategor format
  const fuzzyRules = rules.map(r => ({
    pattern: new RegExp(r.keyword, 'i'),
    category: r.category
  }));
  
  const categorizer = new FuzzyCategor(fuzzyRules);
  
  const transactions: Transaction[] = parsedTransactions.map((pt: ParsedTransaction) => {
    const { category } = categorizer.categorize(pt.description, pt.type);
    
    // Convert amount to negative for debits to match existing logic
    const amount = pt.type === 'debit' ? -Math.abs(pt.amount) : Math.abs(pt.amount);
    
    return {
      id: uuidv4(),
      date: pt.date,
      description: pt.description,
      amount: amount,
      category: category,
      bankName: bankName,
      sourceFile: fileName,
      type: pt.type === 'credit' ? 'credit' : 'debit'
    };
  });

  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));

  const expensesByCategoryMap = new Map<string, number>();
  const monthlyExpensesMap = new Map<string, Map<string, number>>();
  const bankNamesSet = new Set<string>();

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

  const expensesByCategory = Array.from(expensesByCategoryMap.entries()).map(([category, amount]) => ({ category, amount }));
  const monthlyExpensesByCategory = Array.from(monthlyExpensesMap.entries()).map(([month, expensesMap]) => ({
    month,
    expenses: Array.from(expensesMap.entries()).map(([category, amount]) => ({ category, amount }))
  }));

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactions,
    expensesByCategory,
    monthlyExpensesByCategory,
    bankNames: Array.from(bankNamesSet),
    currency: 'INR', // Default to INR
    statementCount: 1
  };
}
