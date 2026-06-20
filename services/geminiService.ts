import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { AnalysisResult, CategorizationRule, FileContent, Transaction } from '../types';

const USD_TO_INR = 84;
const MODEL_PRICING = {
  inputPer1KTokens: 0.075 / 1000 * USD_TO_INR,
  outputPer1KTokens: 0.30 / 1000 * USD_TO_INR,
};

export interface AnalysisUsage {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  costInr: number;
}

export interface AnalysisResponse {
  result: AnalysisResult;
  usage: AnalysisUsage;
}

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    totalIncome: { type: Type.NUMBER, description: "Total income amount." },
    totalExpenses: { type: Type.NUMBER, description: "Total expenses amount. This should be a positive number." },
    netBalance: { type: Type.NUMBER, description: "Net balance (totalIncome - totalExpenses)." },
    bankNames: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array containing the name(s) of the bank(s) found in the statement." },
    currency: { type: Type.STRING, description: "The currency code for the transactions (e.g., 'INR', 'USD'). Default to 'INR' if not specified." },
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "Transaction date in YYYY-MM-DD format." },
          description: { type: Type.STRING, description: "Transaction description." },
          amount: { type: Type.NUMBER, description: "Transaction amount. Positive for income, negative for expenses." },
          category: { type: Type.STRING, description: "Transaction category." },
          bankName: { type: Type.STRING, description: "The name of the bank for this transaction." },
          currency: { type: Type.STRING, description: "The currency of this transaction amount." },
          sourceFile: { type: Type.STRING, description: "The source name of the statement file for this transaction." },
        },
        required: ["date", "description", "amount", "category", "bankName", "currency", "sourceFile"],
      },
    },
    expensesByCategory: {
      type: Type.ARRAY,
      description: "An array of objects, where each object represents an expense category and its total amount.",
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "The name of the expense category." },
          amount: { type: Type.NUMBER, description: "The total positive expense amount for this category." },
        },
        required: ["category", "amount"],
      },
    },
    monthlyExpensesByCategory: {
      type: Type.ARRAY,
      description: "An array of objects, where each object represents a month and contains the breakdown of expenses by category for that month.",
      items: {
        type: Type.OBJECT,
        properties: {
          month: { type: Type.STRING, description: "The month in 'YYYY-MM' format." },
          expenses: {
            type: Type.ARRAY,
            description: "An array of expense categories and their amounts for this month.",
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, description: "The name of the expense category." },
                amount: { type: Type.NUMBER, description: "The total positive expense amount for this category in this month." },
              },
              required: ["category", "amount"],
            },
          },
        },
        required: ["month", "expenses"],
      },
    },
  },
  required: ["totalIncome", "totalExpenses", "netBalance", "transactions", "expensesByCategory", "monthlyExpensesByCategory", "bankNames", "currency"],
};

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000; // Start with a 2-second delay

export const analyzeStatement = async (content: FileContent, rules: CategorizationRule[], fileName: string): Promise<AnalysisResponse> => {
  const storedKey = localStorage.getItem('gemini_api_key');
  let envKey = '';
  try {
      envKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  } catch (e) {
      // Ignore error if process is not defined (e.g., on GitHub Pages)
  }
  const apiKey = storedKey || envKey;
  
  if (!apiKey) {
      throw new Error("API Key is missing. Please provide a Gemini API Key.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';

  let rulesText = "";
  if (rules.length > 0) {
    rulesText = "You MUST strictly follow these custom categorization rules. This is the most important instruction:\n" + rules.map(r => `- If a transaction description contains the exact keyword '${r.keyword}' (case-insensitive), it MUST be categorized as '${r.category}'.`).join('\n');
  }

  const basePrompt = `
    Analyze the following bank statement. The statement can be either text or a file (image/PDF).
    
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
        - Income that isn't part of an adjustment pair should generally be categorized as 'Income'.
    6.  Summarize expenses in the specified array formats:
        - expensesByCategory: An array of objects, each with a 'category' and total positive 'amount'. Example: [{ "category": "Food", "amount": 5000 }, ...].
        - monthlyExpensesByCategory: An array of objects. Each object has a 'month' ('YYYY-MM') and an 'expenses' array (of category/amount objects). Example: [{ "month": "2023-10", "expenses": [{ "category": "Groceries", "amount": 2500 }, ...] }, ...].
    7.  For every transaction you extract, you MUST set the 'sourceFile' property to the following value: '${fileName}'.
    
    **Statement Structure Guidance:**
    -   **CRUCIAL DATA INTEGRITY:** It is absolutely critical that you maintain the correct association for each transaction. The description, date, withdrawal amount, deposit amount, and balance from a single transaction entry MUST be kept together. Do not mix data between different transaction rows. Double-check that the amount you extract belongs to the correct description for that specific line item. This is the most important rule for data extraction.
    -   Bank statements often have headers on each page with account details and addresses. Ignore this information and focus only on the list of transactions.
    -   Transaction descriptions (often under a 'Narration' or 'Description' column) can be split across multiple lines. Lines that are part of the same transaction description are usually indented with spaces at the beginning. You must combine these lines into a single, coherent description for that transaction.
    -   The end of the statement may contain a summary section with total debits and credits. Do not extract transactions from this summary; use the main transaction list only.
    -   Dates may be in DD/MM/YY format. When you see a 2-digit year like '25', interpret it as '2025'. You MUST output all dates in YYYY-MM-DD format.

    **CRITICAL RESPONSE FORMATTING RULE:**
    Your entire output MUST be a single, valid JSON object that strictly adheres to the schema. Do NOT wrap the JSON in markdown backticks (\`\`\`). Pay special attention to properly escaping any double-quote characters (") that appear inside of string values by using a backslash (e.g., "description": "An item with \\"quotes\\" in it.").

    **VERY IMPORTANT CATEGORIZATION INSTRUCTION:**
    If you find a pair of transactions (one credit/income, one debit/expense) for the exact same amount on the same or very close dates (e.g., within a day), and their descriptions suggest they are a reversal or adjustment pair (like 'PRINCIPAL CREDIT ADJUSTMENT' and 'PRINCIPAL DEBIT ADJUSTMENT'), you MUST categorize BOTH transactions as 'Adjustment'. This rule takes precedence over all other categorization rules for these specific pairs.

    **CUSTOM CATEGORIZATION RULES:**
    ${rulesText}

    If a transaction does not match the 'Adjustment' rule or any of the custom rules, you MUST categorize it as follows:
    - For expenses (debits), use the category 'Misc'.
    - For income (credits), use the category 'Income'.
    Do NOT use your own knowledge to guess a category, and do not use any other category names unless they are explicitly provided in the custom rules above. This is a strict requirement.
  `;

  const parts: any[] = [];
  if (content.type === 'text') {
      parts.push({text: `${basePrompt}\n\nBank Statement Text:\n---\n${content.data}\n---`});
  } else {
      parts.push({text: basePrompt});
      parts.push({
          inlineData: {
              data: content.data,
              mimeType: content.mimeType
          }
      });
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts }],
            config: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
            },
        });
        
        if (!response.text) {
            let errorMessage = "The model returned an empty response. The file might be unreadable or empty.";
            if (response?.candidates?.[0]?.finishReason === 'SAFETY') {
                errorMessage = "The analysis was blocked due to safety concerns with the file's content. Please try a different file.";
            } else if (response?.candidates?.[0]?.finishReason) {
                errorMessage = `Analysis stopped unexpectedly. Reason: ${response.candidates[0].finishReason}.`;
            }
            console.error("Gemini response is missing the 'text' property:", response);
            throw new Error(errorMessage);
        }

        let jsonText = response.text.trim();

        // Sanitize the response: remove markdown code block wrappers if they exist.
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.slice(7, -3).trim();
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.slice(3, -3).trim();
        }
        
        let result;
        try {
            result = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse JSON response from Gemini:", e);
            console.error("Malformed JSON string:", jsonText);
            throw new Error("Failed to analyze the bank statement. The model returned an invalid or unexpected response. Please check the file format and content.");
        }
        
        // Post-processing to ensure data consistency
        result.totalExpenses = Math.abs(result.totalExpenses);
        
        result.expensesByCategory.forEach((item: { amount: number }) => {
            item.amount = Math.abs(item.amount);
        });

        result.monthlyExpensesByCategory.forEach((monthData: { expenses: { amount: number }[] }) => {
            monthData.expenses.forEach(item => {
                item.amount = Math.abs(item.amount);
            });
        });
        
        result.transactions.forEach((tx: Partial<Transaction>) => {
            (tx as Transaction).id = uuidv4();
            if(!tx.sourceFile) {
                (tx as Transaction).sourceFile = fileName;
            }
            // The AI is instructed to return positive for income/credit and negative for expenses.
            // We trust the AI's output for the amount sign.
        });

        // Extract usage metadata from response
        const usageMeta = response?.usageMetadata;
        const promptTokens = usageMeta?.promptTokenCount ?? 0;
        const outputTokens = usageMeta?.candidatesTokenCount ?? 0;
        const inputCost = (promptTokens * MODEL_PRICING.inputPer1KTokens);
        const outputCost = (outputTokens * MODEL_PRICING.outputPer1KTokens);

        const usage: AnalysisUsage = {
          promptTokens,
          outputTokens,
          totalTokens: promptTokens + outputTokens,
          costInr: parseFloat((inputCost + outputCost).toFixed(4)),
        };

        return { result: result as AnalysisResult, usage };

    } catch (error: any) {
        const errorMessage = error.message || error.toString();
        const isRetryable = errorMessage.includes("503") || errorMessage.toLowerCase().includes("overloaded") || errorMessage.includes("429") || errorMessage.toLowerCase().includes("too many requests");

        // If it's the last attempt OR it's not a retryable error, formulate a user-friendly error and throw.
        if (attempt === MAX_RETRIES - 1 || !isRetryable) {
            console.error(`Final attempt failed for "${fileName}" or error is not retryable.`, error);

            // Check if it was a retryable error on its last attempt
            if (isRetryable) {
                throw new Error(`The analysis service is currently busy. Please try again in a few moments. (File: "${fileName}")`);
            }

            // Handle non-retryable errors by parsing for details
            let friendlyMessage = `An unexpected error occurred during analysis of "${fileName}".`;
            if (error?.message) {
                const rawMessage = error.message;
                // The error from the SDK might be a JSON string like '{"error":{...}}'
                if (rawMessage.startsWith('{') && rawMessage.endsWith('}')) {
                    try {
                        const errorObj = JSON.parse(rawMessage);
                        const geminiErrorMsg = errorObj?.error?.message;
                        if (geminiErrorMsg) {
                            if (geminiErrorMsg.toLowerCase().includes("document has no pages")) {
                                friendlyMessage = `The file "${fileName}" could not be analyzed. It appears to be empty, corrupted, or password-protected. Please check the file and try again.`;
                            } else {
                                friendlyMessage = `Analysis of "${fileName}" failed: ${geminiErrorMsg}`;
                            }
                        }
                    } catch (e) {
                        // It looked like JSON but wasn't, fall back to raw message.
                        friendlyMessage = `Analysis of "${fileName}" failed: ${rawMessage}`;
                    }
                } else {
                    // Not a JSON string, use it directly.
                    friendlyMessage = `Analysis of "${fileName}" failed: ${rawMessage}`;
                }
            }
            
            throw new Error(friendlyMessage);
        }

        // It's a retryable error and we have attempts left. Wait and continue.
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1}/${MAX_RETRIES} for "${fileName}" failed. Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This fallback should ideally not be reached, but it ensures the function always throws if the loop completes.
  throw new Error(`Failed to analyze "${fileName}" after all retries.`);
};