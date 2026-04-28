import { callProvider } from './providers';
import type { TailoredCv } from './types';

const BRAND_PILLARS = `
1. Excellence: high-stakes reliability, accessibility (WCAG), and crisis communications.
2. Full-spectrum production: from strategy to execution across design, video, and digital.
3. Capability builder: mentor and systems-thinker (project-management expert, lecturer experience).
`;

export const SYSTEM_INSTRUCTION = `
You are an elite Career Strategist and Senior Copywriter.
Transform a master CV into a highly targeted, HUMAN-sounding CV and Cover Letter.

CRITICAL COVER LETTER RULES (STRICT COMPLIANCE):
1. EMPLOYER QUESTIONS: scan the JD for an "Employer questions" section. You MUST explicitly and directly answer EVERY single question within the narrative of the cover letter.
   - If it asks years of experience, give an exact number from the master data.
   - If it asks "Right to work", state the candidate's actual residency from the master data verbatim.
   - If it asks notice period, state the value from the master data (default: 4 weeks).
   - If it asks for specific tools (Adobe, SEO, copywriting, etc.), name them explicitly.
2. NO CLICHES: do not use "excited to apply", "passionate", or "your search ends here".
3. DIRECT PITCH: open with how the candidate's seniority solves the target company's specific problems.
4. NO SIGNATURES: stop after the final paragraph. The frontend renders the sign-off.

CV OPTIMIZATION:
- Use EXACT section headers: "PROFESSIONAL PROFILE", "WORK EXPERIENCE", "EDUCATION", "SKILLS", "PROFESSIONAL REFERENCES".
- EVERY bullet point must include a number/metric.
- DATE FORMAT: "Mon YYYY - Mon YYYY" using 3-letter month abbreviations (e.g. "Mar 2023 - Present", "May 2021 - Jan 2023"). ATS scanners require "MM/YY", "MM/YYYY", or "Month YYYY" — never "5 years" or bare year ranges in role periods.

REQUIRED JSON STRUCTURE: {
  persona, targetJobTitle, professionalProfile, coverLetter, tailoredKeywords,
  experience: Array<{ company, role, period, highlights }>,
  education: Array<{ degree, institution, year }>,
  technicalToolkit: { creative: string[], digital: string[], management: string[], ai: string[] }
}
- IMPORTANT: each experience entry MUST use the field name "period" (not "dates", not "years"). The value MUST be a single string in "Mon YYYY - Mon YYYY" format with the literal " - " separator (e.g. "Feb 2023 - Present").

BRAND PILLARS:${BRAND_PILLARS}
`.trim();

const robustParseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    throw new Error('Invalid AI response — could not parse JSON.');
  }
};

export interface OrchestrateInput {
  jobDescription: string;
  masterCvData: unknown;
  providerId: string;
  model: string;
  apiKey: string;
}

export async function orchestrate(input: OrchestrateInput): Promise<TailoredCv> {
  const userPrompt = [
    'JD WITH EMPLOYER QUESTIONS:',
    input.jobDescription,
    '',
    'CV DATA:',
    JSON.stringify(input.masterCvData),
    '',
    'INSTRUCTION: Produce the tailored JSON now. Ensure the cover letter directly addresses every single "Employer question" found at the bottom of the JD provided above.',
  ].join('\n');

  const responseText = await callProvider(input.providerId, {
    systemPrompt: SYSTEM_INSTRUCTION,
    userPrompt,
    model: input.model,
    apiKey: input.apiKey,
    responseFormat: 'json_object',
  });

  return robustParseJson(responseText) as TailoredCv;
}
