import React, { useEffect, useMemo, useState } from 'react';
import { X, Eye, EyeOff, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PROVIDERS, getProvider, pingProvider } from '../lib/providers';
import type { Settings } from '../lib/storage';

interface Props {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: (next: Settings) => void;
}

type TestState = 'idle' | 'pending' | 'ok' | 'err';

export const SettingsDrawer: React.FC<Props> = ({ open, settings, onClose, onSave }) => {
  const [draft, setDraft] = useState<Settings>(settings);
  const [activeProvider, setActiveProvider] = useState<string>(settings.providerId);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [test, setTest] = useState<Record<string, { state: TestState; message?: string }>>({});

  useEffect(() => { setDraft(settings); setActiveProvider(settings.providerId); }, [settings, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const provider = useMemo(() => getProvider(activeProvider), [activeProvider]);

  if (!open) return null;

  const apiKey = draft.apiKeys[activeProvider] ?? '';
  const model = draft.models[activeProvider] ?? provider?.defaultModel ?? '';

  const setKey = (id: string, value: string) =>
    setDraft({ ...draft, apiKeys: { ...draft.apiKeys, [id]: value } });
  const setModel = (id: string, value: string) =>
    setDraft({ ...draft, models: { ...draft.models, [id]: value } });

  const handleTest = async () => {
    if (!provider) return;
    setTest(t => ({ ...t, [activeProvider]: { state: 'pending' } }));
    const res = await pingProvider(activeProvider, apiKey, model);
    setTest(t => ({ ...t, [activeProvider]: { state: res.ok ? 'ok' : 'err', message: res.message } }));
  };

  const setActive = (id: string) => {
    setActiveProvider(id);
    setDraft(d => ({ ...d, providerId: id }));
  };

  const handleSave = () => {
    onSave({ ...draft, providerId: activeProvider, onboardingComplete: true });
    onClose();
  };

  const testRow = test[activeProvider];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-[90] flex justify-end bg-black/40 no-print animate-in fade-in duration-150"
      onClick={onClose}
    >
      <aside
        onClick={e => e.stopPropagation()}
        className="bg-white border-l-4 border-black w-full sm:w-[560px] h-full overflow-y-auto shadow-[-12px_0_0_0_rgba(0,0,0,1)] animate-in slide-in-from-right-5 duration-200 flex flex-col"
      >
        <header className="flex items-center justify-between px-8 py-6 border-b-4 border-black sticky top-0 bg-white z-10">
          <h2 id="settings-title" className="text-3xl font-black uppercase tracking-tighter italic leading-none">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
          ><X className="w-5 h-5" aria-hidden="true" /></button>
        </header>

        <div className="px-8 py-6 flex-1">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3">AI Provider</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="AI provider">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={activeProvider === p.id}
                  onClick={() => setActive(p.id)}
                  className={`p-3 border-2 border-black text-left transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 ${activeProvider === p.id ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                >
                  <div className="text-[11px] font-black uppercase tracking-widest">{p.label}</div>
                  <div className={`text-[9px] mt-1 ${activeProvider === p.id ? 'text-white/70' : 'text-black/60'}`}>
                    {p.freeTier && '✓ Free tier — '}{p.tagline}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {provider && (
            <div className="space-y-6 border-t-2 border-black pt-6">
              <div>
                <div className="flex items-baseline justify-between mb-2 gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">API Key</p>
                  <a
                    href={provider.keyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-2 hover:bg-black hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    Get key <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKey[activeProvider] ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => setKey(activeProvider, e.target.value)}
                    placeholder={provider.keyPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={!provider.requiresKey}
                    className="w-full p-4 pr-12 border-2 border-black text-sm font-mono bg-white outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  {provider.requiresKey && (
                    <button
                      type="button"
                      onClick={() => setShowKey(s => ({ ...s, [activeProvider]: !s[activeProvider] }))}
                      aria-label={showKey[activeProvider] ? 'Hide key' : 'Show key'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    >
                      {showKey[activeProvider] ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  )}
                </div>
                <p className="text-[9px] uppercase tracking-widest mt-2 text-black/60">
                  Stored only in your browser's localStorage. Never sent to any server other than {provider.label}.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Model</p>
                <select
                  value={model}
                  onChange={e => setModel(activeProvider, e.target.value)}
                  className="w-full p-4 border-2 border-black text-sm font-bold bg-white outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {provider.models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.label}{m.recommended ? ' ★' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={(provider.requiresKey && !apiKey) || testRow?.state === 'pending'}
                  className="px-5 py-3 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 inline-flex items-center gap-2"
                >
                  {testRow?.state === 'pending' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  Test connection
                </button>
                {testRow?.state === 'ok' && (
                  <p className="mt-3 inline-flex items-start gap-2 p-3 border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    Connected — {testRow.message}
                  </p>
                )}
                {testRow?.state === 'err' && (
                  <p className="mt-3 flex items-start gap-2 p-3 border-2 border-black bg-white text-black text-[10px] font-black uppercase tracking-widest">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    Failed — {testRow.message?.slice(0, 200)}
                  </p>
                )}
              </div>

              <details className="border-t-2 border-black pt-4">
                <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.3em] hover:underline">How to get a key</summary>
                <ol className="mt-4 space-y-2 list-decimal list-inside text-sm leading-relaxed">
                  {provider.helpSteps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </details>
            </div>
          )}
        </div>

        <footer className="border-t-4 border-black px-8 py-6 sticky bottom-0 bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
          >Cancel</button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-black text-white border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-[transform,box-shadow] duration-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
          >Save</button>
        </footer>
      </aside>
    </div>
  );
};
