import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Download, Loader2, Sparkles, FileJson, AlertCircle, FileText, UserCircle, RefreshCw, Save, History, ExternalLink, Trash2, CheckCircle, Clock, XCircle, ToggleLeft, ToggleRight, List, Cpu, ArrowLeft } from 'lucide-react';
import masterCvData from '../../master-cv.json';

// Design Styles
import './styles/tokens.css';
import './styles/typography.css';
import './styles/layout.css';

import { Logo } from './components/Logo';

interface Experience { company: string; role: string; period: string; highlights: string[]; }
interface Education { degree: string; institution: string; year: string; }
interface TailoredCv {
  persona: string; targetJobTitle: string; professionalProfile: string; coverLetter: string;
  tailoredKeywords: string[]; experience: Experience[]; education: Education[];
  technicalToolkit: { creative: string[]; digital: string[]; management: string[]; };
}

interface Application {
  id: number; jobTitle: string; company: string; url: string; 
  jobDescription: string; status: 'draft' | 'applied' | 'interview' | 'rejected';
  dateGenerated: string; appliedDate?: string; data?: TailoredCv;
}

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
  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event.reason?.message || event.reason);
    if (suppressPatterns.some(p => msg.includes(p))) event.stopImmediatePropagation();
  }, true);
}

const App: React.FC = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [masterCv, setMasterCv] = useState<any>(masterCvData);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [tailoredCv, setTailoredCv] = useState<TailoredCv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cv' | 'letter' | 'history'>('cv');
  const [history, setHistory] = useState<Application[]>([]);
  const [atsMode, setAtsMode] = useState(true);
  const [provider, setProvider] = useState<'gemini' | 'deepseek'>(() => {
    return (localStorage.getItem('orchestrator-provider') as 'gemini' | 'deepseek') || 'gemini';
  });
  
  const docRef = useRef<HTMLDivElement>(null);

  const GLOBAL_REFERENCES = [
    { name: "Jimmy Logue", company: "Crewcible Studios", email: "jimmy@crewcible.com", phone: "+61 040 0217522" },
    { name: "Kristi Clark", company: "Dionysus", email: "kristi@dionysus.place", phone: "+61 466 937 351" },
    { name: "Yonny Ferisa", company: "Added Value Enterprises", email: "yonatan@addedvalueent.com", phone: "+61 413 924 676" }
  ];

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { localStorage.setItem('orchestrator-provider', provider); }, [provider]);

  const loadHistory = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/applications');
      setHistory(res.data);
    } catch (e) {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setMasterCv(JSON.parse(event.target?.result as string));
        setStatusMessage('Master Source Updated.');
        setTimeout(() => setStatusMessage(''), 2000);
      } catch (err) { setError('Invalid JSON.'); }
    };
    reader.readAsText(file);
  };

  const autoSave = async (data: TailoredCv) => {
    try {
      await axios.post('http://localhost:3001/api/applications', {
        jobTitle, company, url: jobUrl, jobDescription, data
      });
      loadHistory();
      setStatusMessage('Log Auto-Saved.');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (e) {}
  };

  const handleOrchestrate = async () => {
    if (!jobDescription || !jobTitle || !company) {
      setError('Required: Title, Entity, Description.');
      return;
    }
    setLoading(true);
    setError(null);
    setStatusMessage(`Refining w/ ${provider.toUpperCase()}...`);
    try {
      const response = await axios.post('http://localhost:3001/api/orchestrate', {
        jobDescription,
        masterCvData: masterCv,
        provider
      });
      setTailoredCv(response.data);
      setActiveTab('cv');
      await autoSave(response.data);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      setError(`Failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.patch(`http://localhost:3001/api/applications/${id}`, { 
        status, appliedDate: status === 'applied' ? new Date().toISOString() : undefined 
      });
      loadHistory();
    } catch (e) {}
  };

  const deleteApplication = async (id: number) => {
    if (!window.confirm('Delete record?')) return;
    try {
      await axios.delete(`http://localhost:3001/api/applications/${id}`);
      loadHistory();
    } catch (e) {}
  };

  const loadFromHistory = (app: Application) => {
    setJobTitle(app.jobTitle);
    setCompany(app.company);
    setJobUrl(app.url || '');
    setJobDescription(app.jobDescription);
    setTailoredCv(app.data || null);
    setActiveTab('cv');
  };

  const downloadPdf = () => {
    if (!tailoredCv) return;
    const docType = activeTab === 'cv' ? 'CV' : 'Letter';
    const originalTitle = document.title;
    // ATS Compatibility: Use Underscores, No Spaces
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
    const pattern = keywords?.filter(k => k).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!pattern) return text;
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);
    return <>{parts.map((p, i) => regex.test(p) ? <span key={i} className="cv-match-highlight">{p}</span> : p)}</>;
  };

  const formatPeriod = (period: string) => {
    if (!period) return '';
    const parts = period.split(/\s*[-–—]\s*/);
    if (parts.length < 2) return <span className="cv-label" style={{ opacity: 0.4 }}>{period}</span>;
    return (
      <div className="flex flex-col text-[7px] font-black uppercase leading-tight opacity-40">
        <span>{parts[0]}</span>
        <div style={{ height: '4px' }} className="no-print" />
        <span>{parts[1]}</span>
      </div>
    );
  };

  const daysSince = (date?: string) => {
    if (!date) return null;
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return `${diff}d`;
  };

  return (
    <div className={`min-h-screen bg-[#F8F8F8] text-black font-sans flex flex-col ${atsMode ? 'ats-mode' : ''}`}>
      
      {/* HEADER */}
      <nav className="h-20 bg-white border-b border-black flex items-center justify-between px-10 no-print z-50 shadow-sm">
        <div className="flex items-center gap-10">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter italic">Orchestrator</h1>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-300">v4.2 // PERSISTENT HUB</p>
          </div>
          <div className="h-8 w-[1px] bg-gray-100" />
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('cv')} className={`px-6 py-2 border border-black text-[9px] font-black uppercase tracking-widest transition-all ${activeTab !== 'history' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>Workspace</button>
            <button onClick={() => setActiveTab('history')} className={`px-6 py-2 border border-black text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'history' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>
              <List className="w-4 h-4" /> 
              Tracker
              <span className={`px-2 py-0.5 rounded-full text-[8px] ${activeTab === 'history' ? 'bg-white text-black' : 'bg-black text-white'}`}>{history.length}</span>
            </button>
          </div>
        </div>

        {activeTab !== 'history' && tailoredCv && (
          <div className="flex items-center gap-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Render</span>
              <div className="flex border border-black overflow-hidden">
                <button onClick={() => setActiveTab('cv')} className={`px-4 py-2 text-[8px] font-black uppercase transition-all ${activeTab === 'cv' ? 'bg-black text-white' : 'bg-white'}`}>CV</button>
                <button onClick={() => setActiveTab('letter')} className={`px-4 py-2 border-l border-black text-[8px] font-black uppercase transition-all ${activeTab === 'letter' ? 'bg-black text-white' : 'bg-white'}`}>Letter</button>
              </div>
            </div>
            <button onClick={() => setAtsMode(!atsMode)} className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
              ATS Mode {atsMode ? <ToggleRight className="w-6 h-6 text-black" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
            </button>
            <button onClick={downloadPdf} disabled={isExporting} className="bg-black text-white px-8 py-3 border border-black text-[9px] font-black uppercase tracking-[0.3em] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0.5 active:shadow-none transition-all">Export Package</button>
          </div>
        )}
      </nav>

      <main className="flex-1 flex overflow-hidden">
        
        {activeTab === 'history' ? (
          <div className="flex-1 overflow-y-auto p-20 bg-[#F8F8F8]">
            <div className="max-w-6xl mx-auto space-y-16">
              <div className="flex justify-between items-end border-b-2 border-black pb-8">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic">Application Pipeline</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400 mt-2">Managing {history.length} active opportunities</p>
                </div>
                <button onClick={() => setActiveTab('cv')} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1">
                  <ArrowLeft className="w-4 h-4" /> Back to Hub
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {history.map(app => (
                  <div key={app.id} className="group border border-black p-10 bg-white hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,0.05)] transition-all flex flex-col h-full relative">
                    <div className="flex justify-between items-start mb-10">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[8px] font-black px-2 py-1 uppercase border border-black inline-block ${app.status === 'applied' ? 'bg-black text-white' : 'bg-gray-50'}`}>
                          {app.status}
                        </span>
                        {app.appliedDate && <span className="text-[7px] font-black uppercase tracking-widest opacity-30 mt-1">{daysSince(app.appliedDate)} SINCE ACTION</span>}
                      </div>
                      <button onClick={() => deleteApplication(app.id)} className="p-2 text-gray-200 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex-1 space-y-3">
                      <h4 className="text-xl font-black uppercase leading-tight tracking-tighter">{app.jobTitle}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{app.company}</p>
                    </div>
                    <div className="mt-12 space-y-3">
                      <button onClick={() => loadFromHistory(app)} className="w-full py-4 bg-white border border-black text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Reload Workspace</button>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => updateStatus(app.id, 'applied')} className="py-3 border border-black text-[8px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Applied</button>
                        <button onClick={() => updateStatus(app.id, 'rejected')} className="py-3 border border-black text-[8px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Rejected</button>
                      </div>
                      {app.url && <a href={app.url} target="_blank" className="block w-full py-3 bg-gray-50 border border-black flex justify-center items-center gap-2 text-[8px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">View Posting</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="w-[500px] border-r border-black bg-white p-12 flex flex-col gap-10 overflow-y-auto no-print">
              <div className="space-y-8">
                <div className="flex items-center gap-4 p-4 border border-black bg-gray-50">
                  <Cpu className="w-4 h-4 opacity-20" />
                  <div className="flex border border-black overflow-hidden flex-1">
                    <button onClick={() => setProvider('gemini')} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest transition-all ${provider === 'gemini' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>Gemini 1.5</button>
                    <button onClick={() => setProvider('deepseek')} className={`flex-1 py-2 border-l border-black text-[8px] font-black uppercase tracking-widest transition-all ${provider === 'deepseek' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>DeepSeek V3</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Role Architecture</label>
                    <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full p-4 border border-black text-sm font-bold focus:bg-gray-50 outline-none" placeholder="Role..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Target Entity</label>
                    <input value={company} onChange={e => setCompany(e.target.value)} className="w-full p-4 border border-black text-sm font-bold focus:bg-gray-50 outline-none" placeholder="Company..." />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Source URL</label>
                  <input value={jobUrl} onChange={e => setJobUrl(e.target.value)} className="w-full p-4 border border-black text-xs outline-none" placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest opacity-30">JD Intelligence</label>
                  <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} className="w-full h-[280px] p-5 border border-black text-sm outline-none focus:bg-gray-50 leading-relaxed" placeholder="Paste JD..." />
                </div>
                <button onClick={handleOrchestrate} disabled={loading} className="w-full py-6 bg-black text-white font-black uppercase tracking-[0.3em] text-[10px] hover:bg-gray-900 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : 'EXECUTE ALIGNMENT'}
                </button>
                {error && <div className="p-4 border border-red-500 bg-red-50 text-red-600 text-[10px] font-black uppercase flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
                {statusMessage && <p className="text-[10px] font-black text-center uppercase tracking-widest text-green-600 animate-pulse">{statusMessage}</p>}
              </div>
              <div className="mt-auto pt-8 border-t border-gray-100 flex items-center justify-between">
                <div><h3 className="text-[8px] font-black uppercase tracking-widest text-gray-400">IDENTITY</h3><p className="text-[10px] font-bold uppercase">{masterCv?.candidate?.name}</p></div>
                <label className="px-5 py-2 border border-black text-[9px] font-black uppercase cursor-pointer hover:bg-black hover:text-white transition-all">Swap Source<input type="file" accept=".json" onChange={handleFileUpload} className="hidden" /></label>
              </div>
            </section>

            <section className="flex-1 h-screen overflow-y-auto p-20 flex flex-col items-center bg-[#E5E5E5] print:h-auto print:overflow-visible print:p-0 print:block">
              {tailoredCv ? (
                <div ref={docRef} className="animate-in slide-in-from-bottom-10 duration-700 flex flex-col gap-20 print:display-block print:gap-0">
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
                        <h2 className="cv-section-title">PROFESSIONAL PROFILE</h2>
                        <div className="cv-target-title" style={{ marginBottom: '16px', opacity: 0.8 }}>{tailoredCv.targetJobTitle}</div>
                        <p className="cv-lead" style={{ textAlign: 'left' }}>{highlightText(tailoredCv.professionalProfile, tailoredCv.tailoredKeywords || [])}</p>
                      </div>
                    </div>
                    <div className="artboard shadow-2xl">
                      <h2 className="cv-section-title">WORK EXPERIENCE</h2>
                      <div className="flex flex-col gap-10 mt-12">
                        {(tailoredCv.experience || []).map((e, i) => (
                          <div key={i} className="document-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
                            <div className="col-span-2">{formatPeriod(e.period)}</div>
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
                    <div className="artboard shadow-2xl">
                      <h2 className="cv-section-title">EDUCATION & SKILLS</h2>
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
                          <div><span className="cv-label" style={{ display: 'block', marginBottom: '12px' }}>Creative Production</span><div className="flex flex-wrap gap-x-6 gap-y-2">{(tailoredCv.technicalToolkit?.creative || []).map((s, i) => (<span key={i} className="cv-item-meta">{highlightText(s, tailoredCv.tailoredKeywords || [])}</span>))}</div></div>
                          <div><span className="cv-label" style={{ display: 'block', marginBottom: '12px' }}>Digital Architecture</span><div className="flex flex-wrap gap-x-6 gap-y-2">{(tailoredCv.technicalToolkit?.digital || []).map((s, i) => (<span key={i} className="cv-item-meta">{highlightText(s, tailoredCv.tailoredKeywords || [])}</span>))}</div></div>
                        </div>
                        <div className="col-span-6 flex flex-col gap-12">
                          <div><span className="cv-label" style={{ display: 'block', marginBottom: '12px' }}>Systems & Management</span><div className="flex flex-wrap gap-x-6 gap-y-2">{(tailoredCv.technicalToolkit?.management || []).map((s, i) => (<span key={i} className="cv-item-meta">{highlightText(s, tailoredCv.tailoredKeywords || [])}</span>))}</div></div>
                          <div><span className="cv-label" style={{ display: 'block', marginBottom: '12px' }}>Communication</span><div className="flex flex-col gap-3">{(masterCv?.candidate?.languages || []).map((l: any, i: number) => (<div key={i} className="flex justify-between items-baseline"><span className="cv-item-role" style={{ fontSize: '11px' }}>{l.language}</span><span className="cv-item-meta">{l.fluency}</span></div>))}</div></div>
                        </div>
                      </div>
                      <div style={{ marginTop: 'auto', paddingTop: '60px' }}>
                        <h2 className="cv-section-title" style={{ fontSize: '18px', marginBottom: '24px' }}>PROFESSIONAL REFERENCES</h2>
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
                      <header className="flex flex-col items-center" style={{ marginBottom: '80px' }}>
                        <Logo style={{ width: '280px' }} />
                        <div className="cv-target-title" style={{ opacity: 0.6, marginTop: '24px' }}>{tailoredCv.targetJobTitle}</div>
                        <div className="mt-8 flex flex-col items-center gap-1 text-center">
                          <p className="cv-body" style={{ fontSize: '12px', fontWeight: 800 }}>{masterCv?.candidate?.contact?.email} / {masterCv?.candidate?.contact?.phone}</p>
                          <p className="cv-body" style={{ fontSize: '11px', opacity: 0.6 }}>benjaminarnedo.com</p>
                        </div>
                      </header>
                      <div className="cv-body" style={{ fontSize: '12px', textAlign: 'left', lineHeight: '1.6', maxWidth: 'none', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {(tailoredCv.coverLetter || '').split('\n\n').map((para, i) => (<p key={i}>{highlightText(para, tailoredCv.tailoredKeywords || [])}</p>))}
                      </div>
                      <footer style={{ marginTop: 'auto', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ width: '40px', height: '1px', background: 'black', marginBottom: '16px' }} />
                        <span className="cv-label" style={{ opacity: 0.4 }}>Regards</span>
                        <h2 className="cv-item-role" style={{ marginTop: '8px', textTransform: 'none', fontSize: '14px' }}>{masterCv?.candidate?.name}</h2>
                      </footer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md">
                  <div className="w-24 h-24 bg-black text-white flex items-center justify-center mb-10 rotate-3 shadow-xl"><Sparkles className="w-12 h-12" /></div>
                  <h3 className="text-2xl font-black uppercase tracking-[0.3em] mb-4">Strategic Interface</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Complete alignment parameters to initiate orchestration.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
