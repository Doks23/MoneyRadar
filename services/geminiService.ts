import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { AnalysisResult, CategorizationRule, FileContent, LLMConfig, Transaction } from '../types';
import { buildAnalysisPrompt } from './prompts';

const USD_TO_INR = 84;
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
};

const DEFAULT_PRICING = { input: 0.075, output: 0.30 };

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
    bankNames: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bank names found in the statement." },
    currency: { type: Type.STRING, description: "Currency code (e.g., 'INR', 'USD')." },
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "Transaction date in YYYY-MM-DD format." },
          description: { type: Type.STRING, description: "Transaction description." },
          amount: { type: Type.NUMBER, description: "Transaction amount. Positive for income, negative for expenses." },
          category: { type: Type.STRING, description: "Transaction category." },
          bankName: { type: Type.STRING, description: "Bank name for this transaction." },
          currency: { type: Type.STRING, description: "Currency of this transaction." },
          sourceFile: { type: Type.STRING, description: "Source file for this transaction." },
        },
        required: ["date", "description", "amount", "category", "bankName", "currency", "sourceFile"],
      },
    },
    expensesByCategory: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          amount: { type: Type.NUMBER },
        },
        required: ["category", "amount"],
      },
    },
    monthlyExpensesByCategory: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          month: { type: Type.STRING },
          expenses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                amount: { type: Type.NUMBER },
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
const INITIAL_DELAY_MS = 2000;

export const analyzeWithGemini = async (
  content: FileContent,
  rules: CategorizationRule[],
  fileName: string,
  config: LLMConfig
): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  const pricing = MODEL_PRICING[config.model] || DEFAULT_PRICING;
  const basePrompt = buildAnalysisPrompt(rules, fileName);

  const parts: any[] = [];
  if (content.type === 'text') {
    parts.push({ text: `${basePrompt}\n\nBank Statement Text:\n---\n${content.data}\n---` });
  } else if (content.type === 'file') {
    parts.push({ text: basePrompt });
    parts.push({ inlineData: { data: content.data, mimeType: content.mimeType } });
  } else {
    parts.push({ text: basePrompt + '\n\n[Multiple file contents attached]' });
    for (const f of content.data) {
      parts.push({ inlineData: { data: f.data, mimeType: f.mimeType } });
    }
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: config.model,
        contents: [{ parts }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: analysisSchema,
        },
      });

      if (!response.text) {
        let errorMessage = "The model returned an empty response.";
        if (response?.candidates?.[0]?.finishReason === 'SAFETY') {
          errorMessage = "Analysis was blocked due to safety concerns.";
        } else if (response?.candidates?.[0]?.finishReason) {
          errorMessage = `Analysis stopped. Reason: ${response.candidates[0].finishReason}.`;
        }
        throw new Error(errorMessage);
      }

      let jsonText = response.text.trim();
      if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7, -3).trim();
      else if (jsonText.startsWith("```")) jsonText = jsonText.slice(3, -3).trim();

      const result = JSON.parse(jsonText);
      result.totalExpenses = Math.abs(result.totalExpenses);
      result.expensesByCategory?.forEach((item: any) => { item.amount = Math.abs(item.amount); });
      result.monthlyExpensesByCategory?.forEach((md: any) => { md.expenses?.forEach((i: any) => { i.amount = Math.abs(i.amount); }); });
      result.transactions?.forEach((tx: any) => {
        tx.id = uuidv4();
        if (!tx.sourceFile) tx.sourceFile = fileName;
      });

      const usageMeta = response?.usageMetadata;
      const promptTokens = usageMeta?.promptTokenCount ?? 0;
      const outputTokens = usageMeta?.candidatesTokenCount ?? 0;
      const inputCost = promptTokens * (pricing.input / 1000 * USD_TO_INR);
      const outputCost = outputTokens * (pricing.output / 1000 * USD_TO_INR);

      return {
        result: result as AnalysisResult,
        usage: {
          promptTokens,
          outputTokens,
          totalTokens: promptTokens + outputTokens,
          costInr: parseFloat((inputCost + outputCost).toFixed(4)),
        },
      };
    } catch (error: any) {
      const msg = error.message || '';
      const isRetryable = msg.includes("503") || msg.toLowerCase().includes("overloaded") || msg.includes("429") || msg.toLowerCase().includes("too many requests");
      if (attempt === MAX_RETRIES - 1 || !isRetryable) {
        throw new Error(`Gemini analysis failed: ${msg}`);
      }
      await new Promise(r => setTimeout(r, INITIAL_DELAY_MS * Math.pow(2, attempt)));
    }
  }
  throw new Error(`Failed to analyze "${fileName}" after all retries.`);
};
