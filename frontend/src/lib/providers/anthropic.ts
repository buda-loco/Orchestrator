import type { ProviderAdapter } from './types';

export const anthropicAdapter: ProviderAdapter = {
  async generate({ systemPrompt, userPrompt, model, apiKey, maxTokens }) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens ?? 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${res.status}: ${err.slice(0, 500)}`);
    }
    const json = await res.json();
    const content = json.content?.[0]?.text;
    if (typeof content !== 'string') throw new Error('No text in Anthropic response.');
    return content;
  },
};
