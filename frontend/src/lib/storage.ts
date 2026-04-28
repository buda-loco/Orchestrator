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

export const DEFAULT_SETTINGS: Settings = {
  providerId: 'gemini',
  models: {},
  apiKeys: {},
  onboardingComplete: false,
};

export const loadApplications = (): Application[] => {
  try {
    const raw = localStorage.getItem(KEY_APPLICATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveApplications = (apps: Application[]) => {
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
  try {
    const raw = localStorage.getItem(KEY_MASTER_CV);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveMasterCv = (data: unknown) => {
  localStorage.setItem(KEY_MASTER_CV, JSON.stringify(data));
};

export const loadSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSettings = (s: Settings) => {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
};
