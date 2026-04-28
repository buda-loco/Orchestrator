export interface Experience {
  company: string;
  role: string;
  period?: string;
  dates?: string;
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

export interface TailoredCv {
  persona: string;
  targetJobTitle: string;
  professionalProfile: string;
  coverLetter: string;
  tailoredKeywords: string[];
  experience: Experience[];
  education: Education[];
  technicalToolkit?: TechToolkit;
  technical_toolkit?: TechToolkit;
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
