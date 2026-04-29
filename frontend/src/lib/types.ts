export interface Experience {
  company: string;
  role: string;
  period?: string;
  highlights: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface TechToolkit {
  creative: string[];
  digital: string[];
  management: string[];
  ai?: string[];
}

export type RoleArchetype = 'ic-technical' | 'people-leadership' | 'cross-functional' | 'specialist' | 'hybrid';

export interface JdAnalysis {
  mustHave: string[];
  niceToHave: string[];
  keywords: string[];
  implicitPreferences: string[];
  redFlags: string[];
  archetype: RoleArchetype;
}

export interface Reframing {
  original: string;
  reframed: string;
  strategy: 'keyword-alignment' | 'emphasis-shift' | 'abstraction-level' | 'scale-emphasis';
  reason: string;
}

export interface CoverageReport {
  overall: number;
  directMatches: number;
  transferable: number;
  adjacent: number;
  gaps: string[];
  reframings: Reframing[];
  notes: string;
}

export interface TailoredCv {
  persona: string;
  targetJobTitle: string;
  professionalProfile: string;
  coverLetter: string;
  tailoredKeywords: string[];
  experience: Experience[];
  education: Education[];
  technicalToolkit?: TechToolkit;
  jdAnalysis?: JdAnalysis;
  coverageReport?: CoverageReport;
}

export interface Application {
  id: number;
  jobTitle: string;
  company: string;
  url: string;
  jobDescription: string;
  status: 'draft' | 'applied' | 'interview' | 'rejected';
  dateGenerated: string;
  appliedDate?: string;
  lastUpdated?: string;
  data?: TailoredCv;
}
