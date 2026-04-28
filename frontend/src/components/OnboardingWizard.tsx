import React, { useState } from 'react';
import { ArrowRight, ExternalLink, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PROVIDERS, getProvider, pingProvider } from '../lib/providers';
import type { Settings } from '../lib/storage';

interface Props {
  open: boolean;
  initialSettings: Settings;
  onComplete: (next: Settings) => void;
  onSkip: () => void;
}

export const OnboardingWizard: React.FC<Props> = ({ open, initialSettings, onComplete, onSkip }) => {
  const [step, setStep] = useState<'pick' | 'key'>('pick');
  const [providerId, setProviderId] = useState<string>(initialSettings.providerId || 'gemini');
  const [apiKey, setApiKey] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!open) return null;

  const provider = getProvider(providerId);

  const handlePick = (id: string) => {
    setProviderId(id);
    setApiKey(initialSettings.apiKeys[id] ?? '');
    setTestResult(null);
    setStep('key');
  };

  const handleTest = async () => {
    if (!provider) return;
    setTesting(true);
    setTestResult(null);
    const res = await pingProvider(providerId, apiKey, provider.defaultModel);
    setTestResult(res);
    setTesting(false);
  };

  const handleFinish = () => {
    if (!provider) return;
    const next: Settings = {
      ...initialSettings,
      providerId,
      apiKeys: { ...initialSettings.apiKeys, [providerId]: apiKey },
      models: { ...initialSettings.models, [providerId]: provider.defaultModel },
      onboardingComplete: true,
    };
    onComplete(next);
  };

  const canFinish = !provider?.requiresKey || apiKey.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-6 no-print animate-in fade-in duration-200"
    >
      <div className="bg-white border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <header className="px-8 py-8 border-b-4 border-black">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">Welcome</p>
          <h2 id="onboarding-title" className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-[0.9]">
            {step === 'pick' ? 'Pick an AI engine' : `Connect ${provider?.label ?? ''}`}
          </h2>
          <p className="text-sm mt-4 leading-relaxed">
            {step === 'pick'
              ? 'Orchestrator runs entirely in your browser using your own API keys. Pick a provider — you can change it later in Settings.'
              : 'Paste your API key. It stays in your browser; we never send it anywhere except directly to the provider.'}
          </p>
        </header>

        {step === 'pick' && (
          <div className="px-8 py-6 space-y-3">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => handlePick(p.id)}
                className="w-full flex items-start justify-between gap-4 p-5 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-base font-black uppercase tracking-tight">{p.label}</span>
                    {p.freeTier && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-current">Free tier</span>
                    )}
                    {!p.requiresKey && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-current">No key</span>
                    )}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest opacity-70">{p.tagline}</div>
                </div>
                <ArrowRight className="w-5 h-5 shrink-0 self-center" aria-hidden="true" />
              </button>
            ))}
            <button
              onClick={onSkip}
              className="w-full mt-4 py-3 text-[10px] font-black uppercase tracking-widest text-black/60 hover:text-black hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >Skip — I'll configure later</button>
          </div>
        )}

        {step === 'key' && provider && (
          <div className="px-8 py-6 space-y-6">
            {provider.requiresKey ? (
              <>
                <div>
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <label htmlFor="onboarding-key" className="text-[10px] font-black uppercase tracking-[0.3em]">
                      API Key
                    </label>
                    <a
                      href={provider.keyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-2 inline-flex items-center gap-1 hover:bg-black hover:text-white transition-colors"
                    >
                      Get one <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                  <input
                    id="onboarding-key"
                    type="password"
                    value={apiKey}
                    onChange={e => { setApiKey(e.target.value); setTestResult(null); }}
                    placeholder={provider.keyPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                    autoFocus
                    className="w-full p-4 border-2 border-black text-sm font-mono bg-white outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                  />
                </div>

                <details>
                  <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.3em] hover:underline">
                    How to get a key
                  </summary>
                  <ol className="mt-4 space-y-2 list-decimal list-inside text-sm leading-relaxed">
                    {provider.helpSteps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </details>
              </>
            ) : (
              <div className="p-4 border-2 border-black bg-gray-50">
                <p className="text-sm leading-relaxed">
                  <span className="font-black uppercase tracking-widest">No key needed.</span> Make sure {provider.label} is running on your machine.
                </p>
                <ol className="mt-3 space-y-1 list-decimal list-inside text-sm">
                  {provider.helpSteps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}

            <div>
              <button
                onClick={handleTest}
                disabled={testing || (provider.requiresKey && !apiKey)}
                className="px-5 py-3 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 inline-flex items-center gap-2"
              >
                {testing && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                Test connection
              </button>
              {testResult && testResult.ok && (
                <p className="mt-3 inline-flex items-start gap-2 p-3 border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /> Connected.
                </p>
              )}
              {testResult && !testResult.ok && (
                <p className="mt-3 flex items-start gap-2 p-3 border-2 border-black bg-white text-[10px] font-black uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  {testResult.message?.slice(0, 200)}
                </p>
              )}
            </div>
          </div>
        )}

        <footer className="px-8 py-6 border-t-4 border-black flex justify-between gap-3">
          {step === 'key' ? (
            <button
              onClick={() => setStep('pick')}
              className="px-6 py-3 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
            >Back</button>
          ) : <span />}

          {step === 'key' && (
            <button
              onClick={handleFinish}
              disabled={!canFinish}
              className="px-6 py-3 bg-black text-white border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-[transform,box-shadow] duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
            >Get Started</button>
          )}
        </footer>
      </div>
    </div>
  );
};
