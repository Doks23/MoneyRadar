import { AnalysisResult, CategorizationRule, FileContent, LLMConfig } from '../types';
import { analyzeWithGemini, AnalysisResponse as GeminiResponse } from './geminiService';
import { analyzeWithOpenAI, AnalysisResponse as OpenAIResponse } from './openaiService';

export type AnalysisResponse = GeminiResponse;

export function getLLMConfig(): LLMConfig | null {
  const stored = localStorage.getItem('llm_config');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as LLMConfig;
  } catch {
    return null;
  }
}

export async function analyzeStatement(
  content: FileContent,
  rules: CategorizationRule[],
  fileName: string
): Promise<AnalysisResponse> {
  const config = getLLMConfig();
  if (!config) {
    throw new Error('No LLM configuration found. Please configure your AI provider first.');
  }

  switch (config.provider) {
    case 'google':
      return analyzeWithGemini(content, rules, fileName, config);
    case 'openai':
      return analyzeWithOpenAI(content, rules, fileName, config);
    case 'anthropic':
      throw new Error('Anthropic support is coming soon. Please use Google Gemini or OpenAI.');
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
