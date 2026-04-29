import type { TailoredCv, Experience } from './types';

export interface TailoringValidation {
  ok: boolean;
  masterRoleCount: number;
  tailoredRoleCount: number;
  missingRoles: Array<{ company: string; role: string }>;
  thinRoles: Array<{ company: string; role: string; count: number }>;
}

const norm = (s: unknown): string =>
  String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function validateTailoring(master: unknown, tailored: TailoredCv | null): TailoringValidation {
  const masterExp = (master as { experience?: unknown[] } | null)?.experience;
  const masterRoles = Array.isArray(masterExp) ? (masterExp as Experience[]) : [];
  const tailoredRoles = Array.isArray(tailored?.experience) ? tailored!.experience : [];

  const tailoredCompanies = new Set(tailoredRoles.map(e => norm(e.company)));

  const missingRoles = masterRoles
    .filter(m => !tailoredCompanies.has(norm(m.company)))
    .map(m => ({ company: m.company, role: m.role }));

  const thinRoles = tailoredRoles
    .filter(t => Array.isArray(t.highlights) && t.highlights.length < 2)
    .map(t => ({ company: t.company, role: t.role, count: t.highlights?.length ?? 0 }));

  return {
    ok: missingRoles.length === 0 && thinRoles.length === 0,
    masterRoleCount: masterRoles.length,
    tailoredRoleCount: tailoredRoles.length,
    missingRoles,
    thinRoles,
  };
}

export function restoreMissingRoles(master: unknown, tailored: TailoredCv): TailoredCv {
  const masterExp = (master as { experience?: unknown[] } | null)?.experience;
  const masterRoles = Array.isArray(masterExp) ? (masterExp as Experience[]) : [];
  const tailoredRoles = Array.isArray(tailored.experience) ? tailored.experience : [];

  const tailoredByCompany = new Map<string, Experience>();
  tailoredRoles.forEach(e => tailoredByCompany.set(norm(e.company), e));

  const merged: Experience[] = masterRoles.map(m => {
    const t = tailoredByCompany.get(norm(m.company));
    if (t) return t;
    return {
      company: m.company,
      role: m.role,
      period: m.period || m.dates || '',
      highlights: Array.isArray(m.highlights) ? m.highlights : [],
    };
  });

  return { ...tailored, experience: merged };
}
