import type { TailoredCv, Experience } from './types';
import { masterRoles as readMasterRoles } from './master';

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
  const master_ = readMasterRoles(master);
  const tailored_ = Array.isArray(tailored?.experience) ? tailored!.experience : [];

  const tailoredCompanies = new Set(tailored_.map(e => norm(e.company)));

  const missingRoles = master_
    .filter(m => !tailoredCompanies.has(norm(m.company)))
    .map(m => ({ company: m.company, role: m.role }));

  const thinRoles = tailored_
    .filter(t => Array.isArray(t.highlights) && t.highlights.length < 2)
    .map(t => ({ company: t.company, role: t.role, count: t.highlights?.length ?? 0 }));

  return {
    ok: missingRoles.length === 0 && thinRoles.length === 0,
    masterRoleCount: master_.length,
    tailoredRoleCount: tailored_.length,
    missingRoles,
    thinRoles,
  };
}

export function restoreMissingRoles(master: unknown, tailored: TailoredCv): TailoredCv {
  const master_ = readMasterRoles(master);
  const tailored_ = Array.isArray(tailored.experience) ? tailored.experience : [];

  const tailoredByCompany = new Map<string, Experience>();
  tailored_.forEach(e => tailoredByCompany.set(norm(e.company), e));

  const merged: Experience[] = master_.map(m => {
    const t = tailoredByCompany.get(norm(m.company));
    if (t) return t;
    return {
      company: m.company,
      role: m.role,
      period: m.period || '',
      highlights: Array.isArray(m.highlights) ? m.highlights : [],
    };
  });

  return { ...tailored, experience: merged };
}
