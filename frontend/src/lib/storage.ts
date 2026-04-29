import type { Application } from './types';

const KEY_APPLICATIONS = 'orchestrator.applications.v1';
const KEY_MASTER_CV = 'orchestrator.masterCv.v1';
const KEY_SETTINGS = 'orchestrator.settings.v1';

export interface Settings {
  providerId: string;
  models: Record<string, string>;
  apiKeys: Record<string, string>;
  onboardingComplete: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  providerId: 'gemini',
  models: {},
  apiKeys: {},
  onboardingComplete: false,
};

// Reject __proto__ / constructor keys that could pollute Object.prototype when merged.
const safeReviver = (key: string, value: unknown): unknown =>
  key === '__proto__' || key === 'constructor' || key === 'prototype' ? undefined : value;

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw, safeReviver);
    return (parsed as T) ?? fallback;
  } catch {
    return fallback;
  }
};

const isApplication = (a: unknown): a is Application => {
  if (!a || typeof a !== 'object') return false;
  const v = a as Record<string, unknown>;
  return typeof v.id === 'number'
    && typeof v.jobTitle === 'string'
    && typeof v.company === 'string';
};

export const loadApplications = (): Application[] => {
  const parsed = safeParse<unknown>(localStorage.getItem(KEY_APPLICATIONS), []);
  return Array.isArray(parsed) ? parsed.filter(isApplication) : [];
};

const saveApplications = (apps: Application[]) => {
  localStorage.setItem(KEY_APPLICATIONS, JSON.stringify(apps));
};

export const upsertApplication = (input: Partial<Application> & { jobTitle: string; company: string }): Application[] => {
  const apps = loadApplications();
  const idx = apps.findIndex(a =>
    a.jobTitle.toLowerCase() === input.jobTitle.toLowerCase() &&
    a.company.toLowerCase() === input.company.toLowerCase()
  );
  const now = new Date().toISOString();
  if (idx !== -1) {
    apps[idx] = { ...apps[idx], ...input, lastUpdated: now } as Application;
  } else {
    apps.unshift({
      id: Date.now(),
      dateGenerated: now,
      status: 'draft',
      ...input,
    } as Application);
  }
  saveApplications(apps);
  return apps;
};

export const updateApplicationStatus = (id: number, status: Application['status'], appliedDate?: string): Application[] => {
  const apps = loadApplications();
  const updated = apps.map(a => a.id === id ? { ...a, status, ...(appliedDate ? { appliedDate } : {}) } : a);
  saveApplications(updated);
  return updated;
};

export const removeApplication = (id: number): Application[] => {
  const apps = loadApplications().filter(a => a.id !== id);
  saveApplications(apps);
  return apps;
};

export const loadMasterCv = (): unknown | null => {
  return safeParse<unknown>(localStorage.getItem(KEY_MASTER_CV), null);
};

export const saveMasterCv = (data: unknown) => {
  localStorage.setItem(KEY_MASTER_CV, JSON.stringify(data));
};

export const loadSettings = (): Settings => {
  const parsed = safeParse<Partial<Settings>>(localStorage.getItem(KEY_SETTINGS), {});
  return { ...DEFAULT_SETTINGS, ...parsed };
};

export const saveSettings = (s: Settings) => {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
};
