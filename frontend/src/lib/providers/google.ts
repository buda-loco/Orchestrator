import type { ProviderAdapter } from './types';

export const geminiAdapter: ProviderAdapter = {
  async generate({ systemPrompt, userPrompt, model, apiKey, responseFormat }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    };
    if (responseFormat === 'json_object') {
      body.generationConfig = { responseMimeType: 'application/json' };
    }
    const res = await fetch(url, {
      method: 'POST',
      // Header keeps the API key out of the URL (and out of Referer / browser history / access logs).
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const raw = await res.text();
      let detail = raw;
      try {
        const parsed = JSON.parse(raw);
        detail = parsed?.error?.message ?? raw;
      } catch { /* keep raw */ }
      const lower = detail.toLowerCase();
      if (res.status === 429 || lower.includes('quota') || lower.includes('rate')) {
        throw new Error(
          `Gemini rate-limited (429). Free tier: 15 req/min, 1500/day on Flash; ~2 req/min on Pro. ` +
          `Switch to "Gemini 2.0 Flash" in Settings, wait 60s, or check https://ai.google.dev/gemini-api/docs/rate-limits.`
        );
      }
      if (res.status === 400 && lower.includes('api key')) {
        throw new Error('Gemini rejected the API key. Generate a new one at https://aistudio.google.com/apikey and paste it in Settings.');
      }
      if (res.status === 403) {
        throw new Error('Gemini access denied (403). The key may be on a project without the Generative Language API enabled.');
      }
      throw new Error(`Gemini ${res.status}: ${detail.slice(0, 200)}`);
    }
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') throw new Error('No text in Gemini response.');
    return text;
  },
};
