import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

dotenv.config({ path: 'locals.env' });

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const DATA_FILE = path.join(__dirname, '../applications.json');

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

const BRAND_PILLARS = `
1. Government-Grade Excellence: High-stakes reliability, WCAG accessibility compliance, and crisis communications.
2. Full-Spectrum Production: Leading from strategy to execution across design, video, and digital.
3. Creative Capability Builder: Mentor and systems-thinker (ClickUp expert, former Lecturer).
`;

const SYSTEM_INSTRUCTION = `
You are an elite Career Strategist and Senior Copywriter. 
Transform a master CV into a highly targeted, HUMAN-sounding CV and Cover Letter.

CRITICAL COVER LETTER RULES (STRICT COMPLIANCE):
1. EMPLOYER QUESTIONS: Scan the JD for "Employer questions". You MUST explicitly and directly answer EVERY SINGLE ONE within the narrative of the Cover Letter. 
   - If it asks for years of experience, give an exact number based on the master data.
   - If it asks for "Right to work," state "Australian Permanent Resident" clearly.
   - If it asks for "Notice period," state "4 weeks" clearly.
   - If it asks for Adobe products, list them specifically (Photoshop, Illustrator, InDesign, Premiere Pro, After Effects).
   - If it asks for SEO, state "Yes, I have extensive experience in Search Engine Optimisation (SEO)".
   - If it asks for Copywriting, explicitly name "copywriting" in your skills.
2. NO CLICHES: Do not use "excited to apply," "passionate," or "Your search ends here." 
3. DIRECT PITCH: Start with how your 23 years of seniority solves their specific Moto National digital problems.
4. NO SIGNATURES: The frontend handles the "Regards" and name. Stop after the final paragraph.

CV OPTIMIZATION: 
- Use EXACT headers: "PROFESSIONAL PROFILE", "WORK EXPERIENCE", "EDUCATION", "SKILLS", "PROFESSIONAL REFERENCES".
- EVERY bullet point must include a number/metric.
- DATE FORMAT: "Mon YYYY - Mon YYYY" using 3-letter month abbreviations (e.g. "Mar 2023 - Present", "May 2021 - Jan 2023"). ATS scanners require "MM/YY", "MM/YYYY", or "Month YYYY" — never "5 years" or bare year ranges in role periods.

REQUIRED JSON STRUCTURE: { persona, targetJobTitle, professionalProfile, coverLetter, tailoredKeywords, experience: Array<{ company, role, period, highlights }>, education: Array<{ degree, institution, year }>, technicalToolkit: { creative: string[], digital: string[], management: string[], ai: string[] } }
- IMPORTANT: each experience entry MUST use the field name "period" (not "dates", not "years"). The value MUST be a single string in "Mon YYYY - Mon YYYY" format with the literal " - " separator (e.g. "Feb 2023 - Present").
BRAND PILLARS: ${BRAND_PILLARS}
`;

const robustParse = (text: string) => {
  try { return JSON.parse(text); } catch (e) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) return JSON.parse(text.substring(start, end + 1));
    throw new Error("Invalid AI Response.");
  }
};

app.post('/api/orchestrate', async (req, res) => {
  const { jobDescription, masterCvData, provider = 'gemini' } = req.body;
  const prompt = `
    JD WITH EMPLOYER QUESTIONS:
    ${jobDescription}
    
    CV DATA:
    ${JSON.stringify(masterCvData)}
    
    INSTRUCTION: Produce the tailored JSON now. Ensure the Cover Letter directly addresses every single "Employer question" found at the bottom of the JD provided above.
  `;

  try {
    let responseText = '';
    if (provider === 'deepseek') {
      const response = await axios.post('https://api.deepseek.com/chat/completions', {
        model: "deepseek-chat",
        messages: [{ role: "system", content: SYSTEM_INSTRUCTION }, { role: "user", content: prompt }],
        response_format: { type: 'json_object' }
      }, { headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` } });
      responseText = response.data.choices[0].message.content;
    } else {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(`${SYSTEM_INSTRUCTION}\n\n${prompt}`);
      responseText = result.response.text();
    }
    res.json(robustParse(responseText));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/applications', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
});

app.post('/api/applications', (req, res) => {
  const { jobTitle, company } = req.body;
  let applications = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const idx = applications.findIndex((a: any) => a.jobTitle.toLowerCase() === jobTitle.toLowerCase() && a.company.toLowerCase() === company.toLowerCase());
  if (idx !== -1) applications[idx] = { ...applications[idx], ...req.body, lastUpdated: new Date().toISOString() };
  else applications.unshift({ id: Date.now(), dateGenerated: new Date().toISOString(), status: 'draft', ...req.body });
  fs.writeFileSync(DATA_FILE, JSON.stringify(applications, null, 2));
  res.json({ success: true });
});

app.patch('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  let applications = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  applications = applications.map((app: any) => app.id === Number(id) ? { ...app, ...req.body } : app);
  fs.writeFileSync(DATA_FILE, JSON.stringify(applications, null, 2));
  res.json({ success: true });
});

app.delete('/api/applications/:id', (req, res) => {
  let applications = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  applications = applications.filter((app: any) => app.id !== Number(req.params.id));
  fs.writeFileSync(DATA_FILE, JSON.stringify(applications, null, 2));
  res.json({ success: true });
});

app.listen(port, () => console.log(`Backend running on port ${port}`));
