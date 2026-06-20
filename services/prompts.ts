import { CategorizationRule, FileContent } from '../types';

export function buildAnalysisPrompt(rules: CategorizationRule[], fileName: string): string {
  let rulesText = "";
  if (rules.length > 0) {
    rulesText = "You MUST strictly follow these custom categorization rules. This is the most important instruction:\n" + rules.map(r => `- If a transaction description contains the exact keyword '${r.keyword}' (case-insensitive), it MUST be categorized as '${r.category}'.`).join('\n');
  }

  return `
    Analyze the following bank statement.

    Your tasks are:
    1.  Identify the bank name (e.g., 'SBI Card', 'HDFC Bank').
    2.  Identify the currency of the transactions (e.g., INR, USD). If not specified, assume 'INR'.
    3.  Extract all transactions. For each transaction, determine if it's income (credit) or an expense (debit).
        - Amounts marked with 'CR', 'Credit', or similar labels are income and MUST be represented as positive numbers.
        - Amounts without a credit marker, or marked with 'DR', 'Debit', etc., are expenses and MUST be represented as negative numbers.
        - Each transaction must include the bank name and currency.
    4.  Calculate financial summaries:
        - totalIncome: Sum of all income.
        - totalExpenses: Sum of all expenses (must be a positive number).
        - netBalance: totalIncome - totalExpenses.
    5.  Categorize each transaction based on the rules provided below. This is a critical step.
    6.  Summarize expenses in the specified array formats:
        - expensesByCategory: An array of objects, each with a 'category' and total positive 'amount'.
        - monthlyExpensesByCategory: An array of objects. Each object has a 'month' ('YYYY-MM') and an 'expenses' array (of category/amount objects).
    7.  For every transaction you extract, you MUST set the 'sourceFile' property to the following value: '${fileName}'.

    **CRITICAL DATA INTEGRITY:** Maintain the correct association for each transaction. The description, date, withdrawal amount, deposit amount, and balance from a single transaction entry MUST be kept together. Do not mix data between different transaction rows.

    **CRITICAL RESPONSE FORMAT:** Your entire output MUST be a single, valid JSON object that strictly follows this schema:
    {
      "totalIncome": number,
      "totalExpenses": number,
      "netBalance": number,
      "bankNames": string[],
      "currency": string,
      "transactions": [{ "date": "YYYY-MM-DD", "description": string, "amount": number, "category": string, "bankName": string, "currency": string, "sourceFile": string }],
      "expensesByCategory": [{ "category": string, "amount": number }],
      "monthlyExpensesByCategory": [{ "month": "YYYY-MM", "expenses": [{ "category": string, "amount": number }] }]
    }

    **IMPORTANT CATEGORIZATION:** If you find a pair of transactions (one credit, one debit) for the exact same amount on the same or very close dates, and their descriptions suggest a reversal or adjustment, categorize BOTH as 'Adjustment'.

    **CUSTOM RULES:**
    ${rulesText}

    If a transaction does not match the Adjustment rule or any custom rules:
    - For expenses (debits), use the category 'Misc'.
    - For income (credits), use the category 'Income'.
    Do NOT guess categories unless provided in the rules.
  `;
}
