import type { ProviderProfile, ProviderRequest, ProviderAdapter } from './types';
import { openaiCompatAdapter } from './openai-compat';
import { anthropicAdapter } from './anthropic';
import { geminiAdapter } from './google';

export const PROVIDERS: ProviderProfile[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    tagline: 'Generous free tier — easiest to start.',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', recommended: true },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (legacy)' },
    ],
    defaultModel: 'gemini-2.0-flash',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyPlaceholder: 'AIzaSy…',
    requiresKey: true,
    freeTier: true,
    adapter: 'gemini',
    helpSteps: [
      'Visit aistudio.google.com',
      'Sign in with a Google account',
      'Click "Get API key" → "Create API key"',
      'Copy the key (starts with "AIzaSy")',
    ],
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    tagline: 'Best-in-class for writing and tone.',
    models: [
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (balanced)', recommended: true },
      { id: 'claude-opus-4-7', label: 'Claude Opus 4.7 (most capable)' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (fastest)' },
    ],
    defaultModel: 'claude-sonnet-4-6',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-…',
    requiresKey: true,
    freeTier: false,
    adapter: 'anthropic',
    helpSteps: [
      'Visit console.anthropic.com and sign in',
      'Open Settings → API Keys',
      'Click "Create Key", name it, copy the value',
      'Add credits ($5 minimum) under Plans & Billing',
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    tagline: 'Industry standard. Most users have a key.',
    models: [
      { id: 'gpt-4.1', label: 'GPT-4.1', recommended: true },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'o3-mini', label: 'o3-mini (reasoning)' },
    ],
    defaultModel: 'gpt-4.1',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-…',
    requiresKey: true,
    freeTier: false,
    adapter: 'openai-compat',
    baseUrl: 'https://api.openai.com/v1',
    helpSteps: [
      'Visit platform.openai.com and sign in',
      'Open the API Keys page',
      'Click "Create new secret key" → name → Create',
      'Copy the key (starts with "sk-")',
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    tagline: 'One key → 100+ models. Best for experimenting.',
    models: [
      { id: 'openrouter/auto', label: 'Auto (OpenRouter routes for you)', recommended: true },
      { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4 (via OR)' },
      { id: 'openai/gpt-4o', label: 'GPT-4o (via OR)' },
      { id: 'google/gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (via OR)' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    ],
    defaultModel: 'openrouter/auto',
    keyUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-…',
    requiresKey: true,
    freeTier: true,
    adapter: 'openai-compat',
    baseUrl: 'https://openrouter.ai/api/v1',
    helpSteps: [
      'Visit openrouter.ai and sign in',
      'Add credits (or use the free model tier)',
      'Open the Keys page → "Create Key"',
      'Copy the key (starts with "sk-or-v1-")',
    ],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    tagline: 'Cheap and capable. Strong reasoning.',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek V3', recommended: true },
      { id: 'deepseek-reasoner', label: 'DeepSeek R1 (reasoning)' },
    ],
    defaultModel: 'deepseek-chat',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    keyPlaceholder: 'sk-…',
    requiresKey: true,
    freeTier: false,
    adapter: 'openai-compat',
    baseUrl: 'https://api.deepseek.com/v1',
    helpSteps: [
      'Visit platform.deepseek.com and sign in',
      'Add credits ($1 minimum gets you started)',
      'Open API Keys → "Create new API key"',
      'Copy the key (starts with "sk-")',
    ],
  },
  {
    id: 'groq',
    label: 'Groq',
    tagline: 'Fastest inference. Generous free tier.',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', recommended: true },
      { id: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2' },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    ],
    defaultModel: 'llama-3.3-70b-versatile',
    keyUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_…',
    requiresKey: true,
    freeTier: true,
    adapter: 'openai-compat',
    baseUrl: 'https://api.groq.com/openai/v1',
    helpSteps: [
      'Visit console.groq.com and sign in',
      'Open the API Keys page',
      'Click "Create API Key", name it',
      'Copy the key (starts with "gsk_")',
    ],
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    tagline: 'Run models on your machine. No key, no cloud, no cost.',
    models: [
      { id: 'llama3.3', label: 'Llama 3.3', recommended: true },
      { id: 'mistral', label: 'Mistral 7B' },
      { id: 'qwen2.5', label: 'Qwen 2.5' },
    ],
    defaultModel: 'llama3.3',
    keyUrl: 'https://ollama.com/download',
    keyPlaceholder: '(no key required)',
    requiresKey: false,
    freeTier: true,
    adapter: 'openai-compat',
    baseUrl: 'http://localhost:11434/v1',
    helpSteps: [
      'Download Ollama from ollama.com/download',
      'Install and launch (it runs at localhost:11434)',
      'In a terminal: `ollama pull llama3.3`',
      'No API key needed — leave that field blank',
    ],
  },
];

const ADAPTERS: Record<ProviderProfile['adapter'], ProviderAdapter> = {
  'openai-compat': openaiCompatAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
};

export const getProvider = (id: string): ProviderProfile | undefined =>
  PROVIDERS.find(p => p.id === id);

export async function callProvider(providerId: string, request: ProviderRequest): Promise<string> {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  const adapter = ADAPTERS[provider.adapter];
  return adapter.generate({
    ...request,
    baseUrl: request.baseUrl || provider.baseUrl,
  });
}

export async function pingProvider(providerId: string, apiKey: string, model: string): Promise<{ ok: boolean; message: string }> {
  try {
    const text = await callProvider(providerId, {
      systemPrompt: 'You are a connection check.',
      userPrompt: 'Reply with just the word OK.',
      model,
      apiKey,
      maxTokens: 10,
    });
    return { ok: true, message: text.trim().slice(0, 60) || 'OK' };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
