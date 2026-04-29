import type { ProviderAdapter } from './types';

const KEY_PATTERN = /(sk-[A-Za-z0-9_-]{8,}|AIza[A-Za-z0-9_-]{8,}|gsk_[A-Za-z0-9_-]{8,}|Bearer\s+[A-Za-z0-9._-]+)/g;
const sanitize = (s: string) => s.replace(KEY_PATTERN, '[redacted]').slice(0, 300);

export const openaiCompatAdapter: ProviderAdapter = {
  async generate({ systemPrompt, userPrompt, model, apiKey, baseUrl, responseFormat, maxTokens }) {
    const url = `${(baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`;
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
    if (responseFormat === 'json_object') body.response_format = { type: 'json_object' };
    if (maxTokens) body.max_tokens = maxTokens;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${res.status}: ${sanitize(err)}`);
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('No content in response.');
    return content;
  },
};
