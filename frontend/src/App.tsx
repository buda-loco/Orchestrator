import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, AlertCircle, Trash2, List, ArrowLeft, Search, Rocket, Settings as SettingsIcon, Pencil, Check, X as XIcon, FilePlus, ChevronDown } from 'lucide-react';
// Public template seed. Personal data lives in localStorage (loadMasterCv) or is uploaded via the UI.
import masterCvData from '../../master-cv.example.json';

// Design Styles
import './styles/tokens.css';
import './styles/typography.css';
import './styles/layout.css';

import { Logo } from './components/Logo';
import { SettingsDrawer } from './components/SettingsDrawer';
import { OnboardingWizard } from './components/OnboardingWizard';
import type { Application, TailoredCv } from './lib/types';
import {
  loadApplications,
  upsertApplication as storageUpsert,
  updateApplicationStatus as storageUpdateStatus,
  removeApplication as storageRemove,
  loadMasterCv,
  saveMasterCv,
  loadSettings,
  saveSettings,
  type Settings,
} from './lib/storage';
import { orchestrate as runOrchestrate } from './lib/orchestrate';
import { getProvider } from './lib/providers';
import { validateTailoring, restoreMissingRoles } from './lib/validation';

// Global Filter
if (typeof window !== 'undefined') {
  const suppressPatterns = ['Could not establish connection', 'chrome-extension', 'runtime.lastError', 'Receiving end does not exist'];
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...args: any[]) => {
    const msg = args.map(arg => String(arg)).join(' ');
    if (suppressPatterns.some(p => msg.includes(p))) return;
    originalError(...args);
  };
  console.warn = (...args: any[]) => {
    const msg = args.map(arg => String(arg)).join(' ');
    if (suppressPatterns.some(p => msg.includes(p))) return;
    originalWarn(...args);
  };
}

const relativeDays = (date?: string) => {
  if (!date) return null;
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(-days, 'day');
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Normalize "02/2023" / "2/23" / "2023" / "Present" / "Mar 2023" → ATS-recognized "Mon YYYY".
// Falls back to the input if the shape isn't recognized so we never mangle freeform values.
const formatDatePart = (raw: string): string => {
  if (!raw) return '';
  const t = raw.trim();
  let m = t.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) {
    const idx = parseInt(m[1], 10) - 1;
    if (idx >= 0 && idx < 12) return `${MONTHS[idx]} ${m[2]}`;
  }
  m = t.match(/^(\d{1,2})\/(\d{2})$/);
  if (m) {
    const idx = parseInt(m[1], 10) - 1;
    const yy = parseInt(m[2], 10);
    if (idx >= 0 && idx < 12) return `${MONTHS[idx]} ${yy < 50 ? 2000 + yy : 1900 + yy}`;
  }
  return t;
};

const SkeletonPage: React.FC = () => (
  <div className="artboard shadow-sm opacity-50 animate-pulse bg-white flex flex-col p-20">
    <div className="w-48 h-8 bg-gray-100 mx-auto mb-10" />
    <div className="w-full h-[1px] bg-gray-50 mb-10" />
    <div className="space-y-4">
      <div className="w-1/3 h-4 bg-gray-100" />
      <div className="w-full h-32 bg-gray-50" />
      <div className="w-full h-32 bg-gray-50" />
      <div className="w-full h-32 bg-gray-50" />
    </div>
  </div>
);

const App: React.FC = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [masterCv, setMasterCv] = useState<any>(() => loadMasterCv() ?? masterCvData);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [tailoredCv, setTailoredCv] = useState<TailoredCv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cv' | 'letter' | 'history'>('cv');
  const [history, setHistory] = useState<Application[]>(() => loadApplications());
  const [atsMode, setAtsMode] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Application | null>(null);
  const [editingLetter, setEditingLetter] = useState(false);
  const [letterDraft, setLetterDraft] = useState('');
  const [qualityOpen, setQualityOpen] = useState(false);

  const docRef = useRef<HTMLDivElement>(null);

  const GLOBAL_REFERENCES = [
    { name: "Jimmy Logue", company: "Crewcible Studios", email: "jimmy@crewcible.com", phone: "+61 040 0217522" },
    { name: "Kristi Clark", company: "Dionysus", email: "kristi@dionysus.place", phone: "+61 466 937 351" },
    { name: "Yonny Ferisa", company: "Added Value Enterprises", email: "yonatan@addedvalueent.com", phone: "+61 413 924 676" }
  ];

  useEffect(() => {
    if (!settings.onboardingComplete) setOnboardingOpen(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { saveSettings(settings); }, [settings]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!confirmDelete) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setConfirmDelete(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmDelete]);

  const refreshHistory = () => setHistory(loadApplications());

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setMasterCv(parsed);
        saveMasterCv(parsed);
        setStatusMessage('Master Data Updated.');
        setTimeout(() => setStatusMessage(''), 2000);
      } catch { setError('Invalid JSON.'); }
    };
    reader.readAsText(file);
  };

  const handleOrchestrate = async () => {
    if (!jobDescription || !jobTitle || !company) {
      setError('Role, Entity, and JD required.');
      return;
    }
    const provider = getProvider(settings.providerId);
    if (!provider) {
      setError('No AI provider configured. Open Settings to choose one.');
      return;
    }
    const apiKey = settings.apiKeys[settings.providerId] ?? '';
    if (provider.requiresKey && !apiKey) {
      setError(`${provider.label} requires an API key. Open Settings to add one.`);
      setSettingsOpen(true);
      return;
    }
    const model = settings.models[settings.providerId] ?? provider.defaultModel;
    setLoading(true);
    setError(null);
    setStatusMessage(`Synthesizing w/ ${provider.label}…`);
    try {
      const result = await runOrchestrate({
        jobDescription,
        masterCvData: masterCv,
        providerId: settings.providerId,
        model,
        apiKey,
      });
      setTailoredCv(result);
      setActiveTab('cv');
      storageUpsert({ jobTitle, company, url: jobUrl, jobDescription, data: result });
      refreshHistory();
    } catch (err: any) {
      setError(`Failed: ${err?.message ?? String(err)}`);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const updateStatus = (id: number, status: Application['status']) => {
    storageUpdateStatus(id, status, status === 'applied' ? new Date().toISOString() : undefined);
    refreshHistory();
  };

  const performDelete = () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    storageRemove(id);
    refreshHistory();
    setToast('Application deleted');
  };

  const loadFromHistory = (app: Application) => {
    setJobTitle(app.jobTitle);
    setCompany(app.company);
    setJobUrl(app.url || '');
    setJobDescription(app.jobDescription);
    setTailoredCv(app.data || null);
    setActiveTab('cv');
    setEditingLetter(false);
  };

  const handleReset = () => {
    setJobTitle('');
    setCompany('');
    setJobUrl('');
    setJobDescription('');
    setTailoredCv(null);
    setError(null);
    setStatusMessage('');
    setActiveTab('cv');
    setEditingLetter(false);
    setLetterDraft('');
  };

  const startEditLetter = () => {
    if (!tailoredCv) return;
    setLetterDraft(tailoredCv.coverLetter || '');
    setEditingLetter(true);
  };

  const saveLetterEdit = () => {
    if (!tailoredCv) return;
    const updated = { ...tailoredCv, coverLetter: letterDraft };
    setTailoredCv(updated);
    if (jobTitle && company) {
      storageUpsert({ jobTitle, company, url: jobUrl, jobDescription, data: updated });
      refreshHistory();
    }
    setEditingLetter(false);
    setToast('Cover letter saved');
  };

  const cancelLetterEdit = () => {
    setEditingLetter(false);
    setLetterDraft('');
  };

  const validation = useMemo(
    () => (tailoredCv ? validateTailoring(masterCv, tailoredCv) : null),
    [tailoredCv, masterCv]
  );

  const handleRestoreRoles = () => {
    if (!tailoredCv) return;
    const restored = restoreMissingRoles(masterCv, tailoredCv);
    setTailoredCv(restored);
    if (jobTitle && company) {
      storageUpsert({ jobTitle, company, url: jobUrl, jobDescription, data: restored });
      refreshHistory();
    }
    setToast('Missing roles restored from master CV (untailored)');
  };

  const downloadPdf = () => {
    if (!tailoredCv) return;
    const docType = activeTab === 'cv' ? 'CV' : 'Letter';
    const originalTitle = document.title;
    const cleanCompany = company.replace(/[^a-z0-9]/gi, '_');
    const cleanJob = jobTitle.replace(/[^a-z0-9]/gi, '_');
    document.title = `${cleanCompany}_${cleanJob}_${docType}_Benjamin_Arnedo`;
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setIsExporting(false);
    }, 500);
  };

  const highlightText = (text: string, keywords: string[]) => {
    if (!text) return '';
    const list: unknown[] = Array.isArray(keywords)
      ? keywords
      : keywords && typeof keywords === 'object'
        ? (Object.values(keywords as Record<string, unknown>).flat())
        : [];
    const pattern = list
      .filter((k): k is string => typeof k === 'string' && k.length > 0)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    if (!pattern) return text;
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);
    return <>{parts.map((p, i) => regex.test(p) ? <span key={i} className="cv-match-highlight">{p}</span> : p)}</>;
  };

  const formatPeriod = (period: string) => {
    if (!period) return '';
    const parts = period.split(/\s*[-–—]\s*/);
    if (parts.length < 2) return <span className="cv-label" style={{ opacity: 0.4 }}>{formatDatePart(period)}</span>;
    return (
      <div className="flex flex-col text-[7px] print:text-[9px] font-black uppercase leading-tight opacity-40">
        <span>{formatDatePart(parts[0])}</span>
        <div style={{ height: '4px' }} className="no-print" />
        <span>{formatDatePart(parts[1])}</span>
      </div>
    );
  };

  const getPortfolioUrl = () => {
    const cleanCompany = company.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `https://www.benjaminarnedo.com/?utm_source=coverletter&utm_campaign=${cleanCompany}&utm_medium=pdf`;
  };

  const getSkills = (key: 'creative' | 'digital' | 'management' | 'ai') => {
    const aiToolkit = tailoredCv?.technicalToolkit || tailoredCv?.technical_toolkit;
    const fromAi = aiToolkit?.[key];
    if (Array.isArray(fromAi) && fromAi.length > 0) return fromAi;
    const masterToolkit = (masterCv as any).technical_toolkit || (masterCv as any).technicalToolkit;
    return masterToolkit?.[key] || [];
  };

  return (
    <div className={`min-h-screen bg-[#F8F8F8] text-black font-sans flex flex-col overflow-x-hidden ${atsMode ? 'ats-mode' : ''}`}>
      
      {/* COMMAND HEADER — brutal, no apology */}
      <nav className="bg-white border-b-4 border-black px-6 md:px-10 py-4 md:py-5 no-print z-50 flex flex-col md:grid md:grid-cols-3 md:items-center gap-4 md:gap-6">
        {/* LEFT: wordmark */}
        <div className="flex items-center gap-3 md:gap-4 md:justify-self-start">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">Orchestrator</h1>
          <p className="hidden md:block text-[10px] font-black uppercase tracking-[0.4em] self-baseline">v4.3</p>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            className="ml-2 p-2 border-2 border-black hover:bg-black hover:text-white transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <SettingsIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* CENTER: primary tabs */}
        <div className="flex justify-center md:justify-self-center">
          <button
            onClick={() => setActiveTab('cv')}
            aria-pressed={activeTab !== 'history'}
            className={`px-5 md:px-7 py-3 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 ${activeTab !== 'history' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
          >Workspace</button>
          <button
            onClick={() => setActiveTab('history')}
            aria-pressed={activeTab === 'history'}
            className={`px-5 md:px-7 py-3 border-2 border-l-0 border-black text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-3 focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 ${activeTab === 'history' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
          >
            <List className="w-4 h-4" aria-hidden="true" />
            Tracker
            <span
              className={`px-2 py-0.5 text-[10px] font-black ${activeTab === 'history' ? 'bg-white text-black' : 'bg-black text-white'}`}
              aria-label={`${history.length} tracked applications`}
            >{history.length}</span>
          </button>
        </div>

        {/* RIGHT: secondary actions (only when CV is loaded) */}
        {activeTab !== 'history' && tailoredCv && (
          <div className="flex items-center gap-3 md:gap-6 animate-in fade-in duration-500 justify-center md:justify-self-end flex-wrap">
            <button
              onClick={handleReset}
              aria-label="Start a new application"
              title="Clear workspace and start a new application"
              className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <FilePlus className="w-4 h-4" aria-hidden="true" />
              New
            </button>
            <div className="flex border-2 border-black">
              <button
                onClick={() => setActiveTab('cv')}
                aria-pressed={activeTab === 'cv'}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 ${activeTab === 'cv' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
              >CV</button>
              <button
                onClick={() => setActiveTab('letter')}
                aria-pressed={activeTab === 'letter'}
                className={`px-4 py-2 border-l-2 border-black text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 ${activeTab === 'letter' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
              >Letter</button>
            </div>
            {activeTab === 'letter' && (
              editingLetter ? (
                <div className="flex border-2 border-black">
                  <button
                    onClick={saveLetterEdit}
                    aria-label="Save cover letter edits"
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-white hover:text-black text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    Save
                  </button>
                  <button
                    onClick={cancelLetterEdit}
                    aria-label="Discard cover letter edits"
                    className="flex items-center gap-2 px-4 py-2 border-l-2 border-black bg-white hover:bg-black hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    <XIcon className="w-4 h-4" aria-hidden="true" />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditLetter}
                  aria-label="Edit cover letter"
                  title="Edit cover letter text"
                  className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                  Edit
                </button>
              )
            )}
            <button
              onClick={() => setAtsMode(!atsMode)}
              role="switch"
              aria-checked={atsMode}
              aria-label="ATS mode"
              className="flex items-center gap-3 px-1 py-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">ATS</span>
              <span className={`relative inline-block h-6 w-12 border-2 border-black transition-colors ${atsMode ? 'bg-black' : 'bg-white'}`}>
                <span className={`absolute top-0 left-0 block h-5 w-5 border-2 border-black transition-transform ${atsMode ? 'translate-x-6 bg-white' : 'translate-x-0 bg-black'}`} />
              </span>
            </button>
            <button
              onClick={downloadPdf}
              disabled={isExporting}
              className="bg-black text-white px-6 md:px-10 py-3 border-2 border-black text-[10px] font-black uppercase tracking-[0.3em] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-[transform,box-shadow] duration-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
            >{isExporting ? 'Exporting…' : 'Export'}</button>
          </div>
        )}
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {activeTab === 'history' ? (
          /* FULL SCREEN TRACKER */
          <div className="flex-1 overflow-y-auto p-6 md:p-20 bg-[#F8F8F8]">
            <div className="max-w-6xl mx-auto space-y-16">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-black pb-10 gap-8">
                <div className="min-w-0">
                  <h2 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-[0.9] text-balance">Application<br/>Pipeline</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-5">{history.length} Active Opportunities</p>
                </div>
                <button
                  onClick={() => setActiveTab('cv')}
                  className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 active:shadow-none active:translate-x-2 active:translate-y-2 transition-[transform,box-shadow,background-color,color] duration-100 w-full md:w-auto justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Hub
                </button>
              </div>

              {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {history.map(app => (
                    <div
                      key={app.id}
                      className="group border-2 border-black p-8 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-[transform,box-shadow] duration-150 flex flex-col h-full relative min-w-0"
                    >
                      <div className="flex justify-between items-start mb-10 gap-4">
                        <div className="flex flex-col gap-2 min-w-0">
                          <span className={`text-[10px] font-black px-2 py-1 uppercase border-2 border-black inline-block tracking-widest self-start ${app.status === 'applied' ? 'bg-black text-white' : app.status === 'rejected' ? 'bg-white text-black line-through decoration-2' : 'bg-gray-100 text-black'}`}>
                            {app.status}
                          </span>
                          {app.appliedDate && <span className="text-[9px] font-black uppercase tracking-[0.3em] text-black/50">{relativeDays(app.appliedDate)}</span>}
                        </div>
                        <button
                          onClick={() => setConfirmDelete(app)}
                          aria-label={`Delete ${app.jobTitle} at ${app.company}`}
                          className="p-2 text-black/30 hover:text-black hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="flex-1 space-y-3 min-w-0">
                        <h3 className="text-2xl font-black uppercase leading-[0.95] tracking-tighter break-words">{app.jobTitle}</h3>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] break-words">{app.company}</p>
                      </div>
                      <div className="mt-12 space-y-3">
                        <button
                          onClick={() => loadFromHistory(app)}
                          className="w-full py-4 bg-black text-white border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                        >Reload Workspace</button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => updateStatus(app.id, 'applied')}
                            className="py-3 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                          >Applied</button>
                          <button
                            onClick={() => updateStatus(app.id, 'rejected')}
                            className="py-3 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                          >Rejected</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-4 border-dashed border-black p-16 md:p-24 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-black text-white flex items-center justify-center mb-10 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)]">
                    <Search className="w-12 h-12" aria-hidden="true" />
                  </div>
                  <h3 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-[0.9] text-balance">No Missions<br/>Tracked</h3>
                  <p className="text-[10px] uppercase font-black tracking-[0.4em] mt-6 text-black/60">Run an orchestration to populate the pipeline.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* WORKSPACE VIEW */
          <>
            {/* INPUT PANEL — surgical control deck */}
            <section aria-label="Orchestration controls" className="w-full lg:w-[520px] border-r-2 border-black bg-white p-8 md:p-12 flex flex-col gap-8 overflow-y-auto no-print">
              <div className="space-y-7">
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="w-full flex items-center justify-between gap-4 p-4 border-2 border-black bg-white hover:bg-gray-100 transition-colors text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/60">AI Engine</p>
                    <p className="text-[11px] font-black uppercase tracking-widest mt-1 truncate">
                      {getProvider(settings.providerId)?.label ?? 'Not configured'}
                      {(() => {
                        const p = getProvider(settings.providerId);
                        if (!p) return null;
                        const m = settings.models[settings.providerId] ?? p.defaultModel;
                        const found = p.models.find(x => x.id === m);
                        return found ? <span className="ml-2 text-black/50 font-bold">{found.label}</span> : null;
                      })()}
                    </p>
                  </div>
                  <SettingsIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="job-title" className="block text-[10px] font-black uppercase tracking-[0.3em]">Role Architecture</label>
                    <input
                      id="job-title"
                      name="job-title"
                      autoComplete="off"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      className="w-full p-4 border-2 border-black text-sm font-bold bg-white outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                      placeholder="e.g. Senior Designer…"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="company" className="block text-[10px] font-black uppercase tracking-[0.3em]">Target Entity</label>
                    <input
                      id="company"
                      name="company"
                      autoComplete="off"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      className="w-full p-4 border-2 border-black text-sm font-bold bg-white outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                      placeholder="e.g. Anthropic…"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="job-url" className="block text-[10px] font-black uppercase tracking-[0.3em]">Source URL</label>
                  <input
                    id="job-url"
                    name="job-url"
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    value={jobUrl}
                    onChange={e => setJobUrl(e.target.value)}
                    className="w-full p-4 border-2 border-black text-xs bg-white outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                    placeholder="https://…"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="job-description" className="block text-[10px] font-black uppercase tracking-[0.3em]">JD Intelligence</label>
                  <textarea
                    id="job-description"
                    name="job-description"
                    autoComplete="off"
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    className="w-full h-[250px] p-5 border-2 border-black text-sm leading-relaxed bg-white outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                    placeholder="Paste the job description…"
                  />
                </div>

                {statusMessage && (
                  <div role="status" aria-live="polite" className="p-3 border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> {statusMessage}
                  </div>
                )}

                <button
                  onClick={handleOrchestrate}
                  disabled={loading}
                  className="w-full py-6 bg-black text-white border-2 border-black font-black uppercase tracking-[0.3em] text-[11px] hover:bg-white hover:text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 active:shadow-none active:translate-x-2 active:translate-y-2 transition-[transform,box-shadow,background-color,color] duration-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                      <span>Synthesizing…</span>
                    </span>
                  ) : 'Execute Alignment'}
                </button>

                {error && (
                  <div role="alert" className="p-4 border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" /> {error}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-8 border-t-2 border-black flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em]">Identity</p>
                  <p className="text-[11px] font-black uppercase truncate mt-1">{masterCv?.candidate?.name}</p>
                </div>
                <label className="px-5 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black hover:text-white transition-colors focus-within:ring-4 focus-within:ring-black focus-within:ring-offset-2">
                  Swap Source
                  <input type="file" accept=".json" onChange={handleFileUpload} className="sr-only" />
                </label>
              </div>
            </section>

            {/* PREVIEW VIEWPORT (RESPONSIVE PADDING) */}
            <section className="flex-1 h-screen overflow-y-auto p-4 sm:p-10 md:p-20 flex flex-col items-center bg-[#E5E5E5] print:h-auto print:overflow-visible print:p-0 print:block">
              {loading ? (
                /* LOADING SKELETONS */
                <div className="flex flex-col gap-20 animate-in fade-in duration-500">
                  <SkeletonPage />
                  <SkeletonPage />
                  <SkeletonPage />
                </div>
              ) : tailoredCv ? (
                /* DOCUMENT RENDER */
                <div ref={docRef} className="animate-in slide-in-from-bottom-10 duration-700 flex flex-col gap-20 print:display-block print:gap-0">
                  {/* VALIDATION BANNER — fires when model dropped roles or returned thin highlights */}
                  {validation && !validation.ok && (
                    <div className="no-print w-full max-w-[840px] self-center -mb-10 border-2 border-black bg-yellow-200 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                      <div className="p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                              Output incomplete
                            </p>
                            <p className="text-sm mt-2 leading-relaxed">
                              The model returned <strong>{validation.tailoredRoleCount}</strong> of <strong>{validation.masterRoleCount}</strong> roles from your master CV
                              {validation.missingRoles.length > 0 && ' — '}
                              {validation.thinRoles.length > 0 && validation.missingRoles.length > 0 && ', and '}
                              {validation.thinRoles.length > 0 && (
                                <>
                                  <strong>{validation.thinRoles.length}</strong> role
                                  {validation.thinRoles.length === 1 ? ' has' : 's have'} fewer than 2 highlights
                                </>
                              )}
                              .
                            </p>
                          </div>
                        </div>

                        {validation.missingRoles.length > 0 && (
                          <div className="ml-8 space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em]">Missing roles</p>
                            <ul className="text-xs space-y-0.5">
                              {validation.missingRoles.map((r, i) => (
                                <li key={i}>· <strong>{r.company}</strong> — {r.role}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {validation.thinRoles.length > 0 && (
                          <div className="ml-8 space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em]">Thin roles ( 1 highlight)</p>
                            <ul className="text-xs space-y-0.5">
                              {validation.thinRoles.map((r, i) => (
                                <li key={i}>· <strong>{r.company}</strong> — {r.role} ({r.count} bullet{r.count === 1 ? '' : 's'})</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="ml-8 flex flex-wrap gap-3 pt-2">
                          {validation.missingRoles.length > 0 && (
                            <button
                              onClick={handleRestoreRoles}
                              className="px-4 py-2 bg-black text-white border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                            >
                              Restore from master (untailored)
                            </button>
                          )}
                          <button
                            onClick={handleOrchestrate}
                            disabled={loading}
                            className="px-4 py-2 bg-white text-black border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                          >
                            Re-run orchestration
                          </button>
                        </div>

                        <p className="ml-8 text-[10px] opacity-70 leading-relaxed">
                          Tip: smaller models (DeepSeek V3, Gemini Flash) sometimes truncate. Switch to Claude Sonnet or Gemini 2.5 Pro in Settings for stricter instruction-following.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* QUALITY REPORT — model self-scored coverage; not printed */}
                  {tailoredCv.coverageReport && (
                    <div className="no-print w-full max-w-[840px] self-center -mb-10 border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                      <button
                        type="button"
                        onClick={() => setQualityOpen(o => !o)}
                        aria-expanded={qualityOpen}
                        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
                      >
                        <div className="flex items-center gap-6 flex-wrap min-w-0">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-black/50">JD Coverage</span>
                            <span className="text-3xl font-black leading-none">{Math.round(tailoredCv.coverageReport.overall ?? 0)}%</span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                            <span className="px-2 py-1 bg-black text-white">{tailoredCv.coverageReport.directMatches ?? 0} Direct</span>
                            <span className="px-2 py-1 border-2 border-black">{tailoredCv.coverageReport.transferable ?? 0} Transf</span>
                            <span className="px-2 py-1 border-2 border-black">{tailoredCv.coverageReport.adjacent ?? 0} Adj</span>
                            {(tailoredCv.coverageReport.gaps?.length ?? 0) > 0 && (
                              <span className="px-2 py-1 border-2 border-black bg-yellow-200">{tailoredCv.coverageReport.gaps.length} Gap</span>
                            )}
                          </div>
                          {tailoredCv.jdAnalysis?.archetype && (
                            <span className="text-[10px] font-black uppercase tracking-widest border-l-2 border-black pl-4 hidden sm:inline">
                              {tailoredCv.jdAnalysis.archetype.replace(/-/g, ' ')}
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${qualityOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>
                      {qualityOpen && (
                        <div className="border-t-2 border-black p-6 space-y-6 text-sm">
                          {tailoredCv.coverageReport.notes && (
                            <section>
                              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Critic notes</h3>
                              <p className="leading-relaxed">{tailoredCv.coverageReport.notes}</p>
                            </section>
                          )}
                          {(tailoredCv.coverageReport.gaps?.length ?? 0) > 0 && (
                            <section>
                              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Unaddressed JD requirements</h3>
                              <ul className="space-y-1.5">
                                {tailoredCv.coverageReport.gaps.map((g, i) => (
                                  <li key={i} className="flex gap-2 leading-relaxed">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                                    <span>{g}</span>
                                  </li>
                                ))}
                              </ul>
                            </section>
                          )}
                          {(tailoredCv.coverageReport.reframings?.length ?? 0) > 0 && (
                            <section>
                              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Reframings applied ({tailoredCv.coverageReport.reframings.length})</h3>
                              <ul className="space-y-4">
                                {tailoredCv.coverageReport.reframings.map((r, i) => (
                                  <li key={i} className="border-l-2 border-black pl-3 space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-black/50">{r.strategy?.replace(/-/g, ' ')}</p>
                                    <p className="text-xs opacity-60 line-through">{r.original}</p>
                                    <p className="leading-relaxed">{r.reframed}</p>
                                    {r.reason && <p className="text-xs opacity-60 italic">{r.reason}</p>}
                                  </li>
                                ))}
                              </ul>
                            </section>
                          )}
                          {tailoredCv.jdAnalysis && (
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {(tailoredCv.jdAnalysis.mustHave?.length ?? 0) > 0 && (
                                <div>
                                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Must-have</h3>
                                  <ul className="space-y-1 text-xs">
                                    {tailoredCv.jdAnalysis.mustHave.map((m, i) => <li key={i}>· {m}</li>)}
                                  </ul>
                                </div>
                              )}
                              {(tailoredCv.jdAnalysis.redFlags?.length ?? 0) > 0 && (
                                <div>
                                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Red flags</h3>
                                  <ul className="space-y-1 text-xs">
                                    {tailoredCv.jdAnalysis.redFlags.map((m, i) => <li key={i}>· {m}</li>)}
                                  </ul>
                                </div>
                              )}
                            </section>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {/* CV */}
                  <div className={activeTab === 'cv' ? 'contents' : 'print-hidden hidden'}>
                    <div className="artboard shadow-2xl">
                      <header className="flex flex-col items-center" style={{ marginTop: '20px' }}>
                        <Logo style={{ width: '320px' }} />
                        <div className="mt-8 flex flex-col items-center gap-1 text-center">
                          <p className="cv-body" style={{ fontWeight: 800 }}>{masterCv?.candidate?.location}</p>
                          <p className="cv-body">{masterCv?.candidate?.contact?.email} / {masterCv?.candidate?.contact?.phone}</p>
                          <p className="cv-body" style={{ fontSize: '10px', opacity: 0.6 }}>linkedin.com/in/benjaminarnedo / benjaminarnedo.com</p>
                        </div>
                      </header>
                      <div style={{ marginTop: 'auto', marginBottom: '80px' }}>
                        <span className="cv-label" style={{ opacity: 0.4 }}>IDENTITY</span>
                        <h2 className="cv-section-title" style={{ marginTop: '8px', marginBottom: '24px' }}>PROFESSIONAL PROFILE</h2>
                        <div className="cv-target-title" style={{ marginBottom: '16px', opacity: 0.8 }}>{tailoredCv.targetJobTitle}</div>
                        <p className="cv-lead" style={{ textAlign: 'left' }}>{highlightText(tailoredCv.professionalProfile, tailoredCv.tailoredKeywords || [])}</p>
                      </div>
                    </div>
                    {/* PAGE 2 */}
                    <div className="artboard shadow-2xl">
                      <span className="cv-label" style={{ opacity: 0.4 }}>EXPERIENCE</span>
                      <h2 className="cv-section-title" style={{ marginTop: '8px' }}>WORK EXPERIENCE</h2>
                      <div className="flex flex-col gap-10 mt-12">
                        {(tailoredCv.experience || []).map((e, i) => (
                          <div key={i} className="document-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
                            <div className="col-span-2">{formatPeriod(e.period || e.dates || '')}</div>
                            <div className="col-span-10">
                              <h3 className="cv-item-role">{e.role}</h3>
                              <span className="cv-label" style={{ color: 'black', display: 'block', marginBottom: '8px', opacity: 1 }}>{e.company}</span>
                              <ul className="flex flex-col gap-1.5">
                                {e.highlights.map((h, idx) => (
                                  <li key={idx} className="cv-body" style={{ position: 'relative', paddingLeft: '14px', lineHeight: '1.4' }}>
                                    <span style={{ position: 'absolute', left: 0, opacity: 0.2 }}>•</span>
                                    {highlightText(h, tailoredCv.tailoredKeywords || [])}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* PAGE 3 */}
                    <div className="artboard shadow-2xl">
                      <span className="cv-label" style={{ opacity: 0.4 }}>INFRASTRUCTURE</span>
                      <h2 className="cv-section-title" style={{ marginTop: '8px' }}>EDUCATION & SKILLS</h2>
                      <div className="document-grid" style={{ marginTop: '40px' }}>
                        <div className="col-span-12">
                          <span className="cv-label" style={{ display: 'block', marginBottom: '16px', borderBottom: '1px solid black', paddingBottom: '4px' }}>EDUCATION</span>
                          <div className="grid grid-cols-2 gap-8">
                            {(tailoredCv.education || []).map((edu, i) => (
                              <div key={i}><p className="cv-item-role" style={{ fontSize: '12px' }}>{edu.degree}</p><p className="cv-body" style={{ fontWeight: 800 }}>{edu.institution}</p><p className="cv-item-meta">{edu.year}</p></div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="document-grid" style={{ marginTop: '60px' }}>
                        <div className="col-span-12"><span className="cv-label" style={{ display: 'block', marginBottom: '16px', borderBottom: '1px solid black', paddingBottom: '4px' }}>SKILLS</span></div>
                        <div className="col-span-6 flex flex-col gap-12">
                          <div><span className="cv-label" style={{ display: 'block', marginBottom: '12px' }}>Creative Production</span><div className="flex flex-wrap gap-x-6 gap-y-2">{getSkills('creative').map((s, i) => (<span key={i} className="cv-item-meta">{s}</span>))}</div></div>
                          <div><span className="cv-label" style={{ display: 'block', marginBottom: '12px' }}>Digital Architecture</span><div className="flex flex-wrap gap-x-6 gap-y-2">{getSkills('digital').map((s, i) => (<span key={i} className="cv-item-meta">{s}</span>))}</div></div>
                        </div>
                        <div className="col-span-6 flex flex-col gap-12">
                          <div><span className="cv-label" style={{ display: 'block', marginBottom: '12px' }}>Systems & Management</span><div className="flex flex-wrap gap-x-6 gap-y-2">{getSkills('management').map((s, i) => (<span key={i} className="cv-item-meta">{s}</span>))}</div></div>
                          {getSkills('ai').length > 0 && (
                            <div><span className="cv-label" style={{ display: 'block', marginBottom: '12px' }}>AI Augmentation</span><div className="flex flex-wrap gap-x-6 gap-y-2">{getSkills('ai').map((s, i) => (<span key={i} className="cv-item-meta">{s}</span>))}</div></div>
                          )}
                          <div><span className="cv-label" style={{ display: 'block', marginBottom: '12px' }}>Communication</span><div className="flex flex-col gap-3">{(masterCv?.candidate?.languages || masterCvData.candidate.languages || []).map((l: any, i: number) => (<div key={i} className="flex justify-between items-baseline"><span className="cv-item-role" style={{ fontSize: '11px' }}>{l.language}</span><span className="cv-item-meta">{l.fluency}</span></div>))}</div></div>
                        </div>
                      </div>
                      <div style={{ marginTop: 'auto', paddingTop: '60px' }}>
                        <h2 className="cv-section-title" style={{ fontSize: '18px', marginBottom: '24px' }}>VERIFICATION</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                          {GLOBAL_REFERENCES.map((r, i) => (
                            <div key={i} className="flex flex-col gap-1">
                              <span className="cv-item-role" style={{ fontSize: '12px' }}>{r.name}</span>
                              <span className="cv-label" style={{ color: 'black', marginBottom: '4px', opacity: 1 }}>{r.company}</span>
                              <span className="cv-item-meta" style={{ fontSize: '9px' }}>{r.email}</span>
                              <span className="cv-item-meta" style={{ fontSize: '9px' }}>{r.phone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* LETTER */}
                  <div className={activeTab === 'letter' ? 'contents' : 'print-hidden hidden'}>
                    <div className="artboard shadow-2xl">
                      <header className="flex flex-col items-center" style={{ marginBottom: '48px', marginTop: '0px' }}>
                        <Logo style={{ width: '280px' }} />
                        <div className="cv-target-title" style={{ opacity: 0.6, marginTop: '16px' }}>{tailoredCv.targetJobTitle}</div>
                        <div className="mt-6 flex flex-col items-center gap-1 text-center">
                          <p className="cv-body" style={{ fontSize: '10px' }}>{masterCv?.candidate?.contact?.email} / {masterCv?.candidate?.contact?.phone}</p>
                          <p className="cv-body" style={{ fontSize: '10px', opacity: 0.6 }}>benjaminarnedo.com</p>
                        </div>
                      </header>
                      <div className="cv-body" style={{ fontSize: '12px', textAlign: 'left', lineHeight: '1.6', maxWidth: 'none', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {editingLetter ? (
                          <textarea
                            value={letterDraft}
                            onChange={e => setLetterDraft(e.target.value)}
                            autoFocus
                            spellCheck
                            aria-label="Cover letter body"
                            className="no-print w-full border-2 border-black p-4 outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 resize-y bg-white"
                            style={{ fontFamily: 'inherit', fontSize: '12px', lineHeight: '1.6', minHeight: '420px', whiteSpace: 'pre-wrap' }}
                          />
                        ) : (
                          (tailoredCv.coverLetter || '').split('\n\n').map((para, i) => (<p key={i}>{highlightText(para, tailoredCv.tailoredKeywords || [])}</p>))
                        )}
                        <div style={{ marginTop: '16px', borderTop: '1px solid black', paddingTop: '16px' }}>
                          <p className="cv-body" style={{ marginBottom: '8px', opacity: 0.6 }}>If you want to see some of my work that covers from web design, graphic design, video and photo, please refer to my portfolio where I upload all my latest works:</p>
                          <a href={getPortfolioUrl()} className="cv-item-role" style={{ fontSize: '14px', textDecoration: 'underline' }}>{getPortfolioUrl().split('?')[0]}</a>
                        </div>
                        <p style={{ marginTop: '20px' }}>Regards,</p>
                        <p className="font-bold">{masterCv?.candidate?.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* EMPTY HUB — the void before the orchestration */
                <div className="h-full flex flex-col items-center justify-center text-center max-w-3xl animate-in fade-in duration-1000 px-6">
                  <div className="w-40 h-40 md:w-48 md:h-48 bg-black text-white flex items-center justify-center mb-12 rotate-3 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                    <Rocket className="w-20 h-20 md:w-24 md:h-24" aria-hidden="true" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter italic leading-[0.85] mb-6 text-balance">Strategic<br/>Interface</h2>
                  <p className="text-[11px] md:text-xs font-black uppercase tracking-[0.4em] text-black/60 leading-loose max-w-md text-balance">Input target parameters to initiate high-fidelity senior alignment.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6 no-print animate-in fade-in duration-150"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="confirm-delete-title" className="text-2xl sm:text-3xl font-black uppercase tracking-tighter italic mb-4 leading-[0.95]">Delete Record?</h2>
            <p className="text-sm leading-relaxed mb-8">
              This will permanently remove <span className="font-black">{confirmDelete.jobTitle}</span> at <span className="font-black">{confirmDelete.company}</span> from your pipeline.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
              >Cancel</button>
              <button
                onClick={performDelete}
                autoFocus
                className="flex-1 py-3 bg-black text-white border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2"
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 left-6 sm:left-auto z-[100] bg-black text-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] sm:max-w-sm flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 no-print"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{toast}</span>
        </div>
      )}

      <SettingsDrawer
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(next) => { setSettings(next); setToast('Settings saved'); }}
      />

      <OnboardingWizard
        open={onboardingOpen}
        initialSettings={settings}
        onComplete={(next) => { setSettings(next); setOnboardingOpen(false); }}
        onSkip={() => { setSettings({ ...settings, onboardingComplete: true }); setOnboardingOpen(false); }}
      />
    </div>
  );
};

export default App;
