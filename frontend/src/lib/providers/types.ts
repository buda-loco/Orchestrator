export interface ProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  responseFormat?: 'json_object' | 'text';
  maxTokens?: number;
}

export interface ProviderAdapter {
  generate(req: ProviderRequest): Promise<string>;
}

export interface ProviderModel {
  id: string;
  label: string;
  recommended?: boolean;
}

export interface ProviderProfile {
  id: string;
  label: string;
  tagline: string;
  models: ProviderModel[];
  defaultModel: string;
  keyUrl: string;
  keyPlaceholder: string;
  requiresKey: boolean;
  freeTier: boolean;
  baseUrl?: string;
  adapter: 'openai-compat' | 'anthropic' | 'gemini';
  helpSteps: string[];
}
