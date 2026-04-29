import type { Experience, TechToolkit } from './types';

export interface MasterCv {
  candidate?: {
    name?: string;
    title?: string;
    location?: string;
    contact?: { email?: string; phone?: string; portfolio?: string };
    languages?: Array<{ language: string; fluency: string }>;
  };
  professional_profile?: string;
  experience_modules?: Experience[];
  experience?: Experience[];
  technical_toolkit?: TechToolkit;
  technicalToolkit?: TechToolkit;
  education?: Array<{ degree: string; institution: string; year?: string; period?: string }>;
}

export const masterRoles = (master: unknown): Experience[] => {
  const m = master as MasterCv | null;
  if (Array.isArray(m?.experience_modules)) return m!.experience_modules!;
  if (Array.isArray(m?.experience)) return m!.experience!;
  return [];
};

export const masterToolkit = (master: unknown): TechToolkit | undefined => {
  const m = master as MasterCv | null;
  return m?.technical_toolkit ?? m?.technicalToolkit;
};

export const slugify = (s: string): string =>
  s.replace(/[^a-z0-9]/gi, '_');
