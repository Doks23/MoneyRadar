import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisResult, CategorizationRule, FileContent, LLMConfig } from '../types';
import { buildAnalysisPrompt } from './prompts';

const USD_TO_INR = 84;
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
};

const DEFAULT_PRICING = { input: 2.50, output: 10.00 };

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

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000;

export const analyzeWithOpenAI = async (
  content: FileContent,
  rules: CategorizationRule[],
  fileName: string,
  config: LLMConfig
): Promise<AnalysisResponse> => {
  const openai = new OpenAI({ apiKey: config.apiKey, dangerouslyAllowBrowser: true });
  const pricing = MODEL_PRICING[config.model] || DEFAULT_PRICING;
  const basePrompt = buildAnalysisPrompt(rules, fileName);

  const schemaDescription = `Respond with a JSON object exactly matching this schema:
{
  "totalIncome": number,
  "totalExpenses": number,
  "netBalance": number,
  "bankNames": string[],
  "currency": string,
  "transactions": [{ "date": "YYYY-MM-DD", "description": string, "amount": number, "category": string, "bankName": string, "currency": string, "sourceFile": string }],
  "expensesByCategory": [{ "category": string, "amount": number }],
  "monthlyExpensesByCategory": [{ "month": "YYYY-MM", "expenses": [{ "category": string, "amount": number }] }]
}`;

  const userContent: any[] = [];
  if (content.type === 'text') {
    userContent.push({ type: 'text', text: `${basePrompt}\n\nBank Statement Text:\n---\n${content.data}\n---` });
  } else if (content.type === 'file') {
    userContent.push({ type: 'text', text: basePrompt });
    const base64Data = content.data.includes('base64,') ? content.data.split('base64,')[1] : content.data;
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:${content.mimeType};base64,${base64Data}` },
    });
  } else {
    userContent.push({ type: 'text', text: basePrompt + '\n\n[Multiple file contents attached]' });
    for (const f of content.data) {
      const d = f.data.includes('base64,') ? f.data.split('base64,')[1] : f.data;
      userContent.push({ type: 'image_url', image_url: { url: `data:${f.mimeType};base64,${d}` } });
    }
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: `You are a financial statement analyzer. ${schemaDescription}\n\nOnly respond with valid JSON. No markdown. No explanation.` },
          { role: 'user', content: userContent as any },
        ],
        response_format: { type: 'json_object' },
      });

      const text = response.choices?.[0]?.message?.content;
      if (!text) throw new Error('Empty response from OpenAI.');

      const result = JSON.parse(text);
      result.totalExpenses = Math.abs(result.totalExpenses);
      result.expensesByCategory?.forEach((item: any) => { item.amount = Math.abs(item.amount); });
      result.monthlyExpensesByCategory?.forEach((md: any) => { md.expenses?.forEach((i: any) => { i.amount = Math.abs(i.amount); }); });
      result.transactions?.forEach((tx: any) => {
        tx.id = uuidv4();
        if (!tx.sourceFile) tx.sourceFile = fileName;
      });

      const usage = response.usage;
      const promptTokens = usage?.prompt_tokens ?? 0;
      const outputTokens = usage?.completion_tokens ?? 0;
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
      const isRetryable = msg.includes("503") || msg.toLowerCase().includes("overloaded") || msg.includes("429") || msg.toLowerCase().includes("rate limit");
      if (attempt === MAX_RETRIES - 1 || !isRetryable) {
        throw new Error(`OpenAI analysis failed: ${msg}`);
      }
      await new Promise(r => setTimeout(r, INITIAL_DELAY_MS * Math.pow(2, attempt)));
    }
  }
  throw new Error(`Failed to analyze "${fileName}" after all retries.`);
};
