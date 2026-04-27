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
You are an elite Career Strategist and ATS Specialist.
Transform a master CV into a highly targeted, HUMAN CV and Cover Letter.

ATS COMPATIBILITY RULES (CRITICAL):
1. MEASURABLE RESULTS: EVERY single experience highlight MUST contain a number, percentage, or unit of scale (e.g., "Increased engagement by 45%", "Managed 12+ social channels", "Delivered 500+ design assets", "Reduced turnaround time by 2 days"). NO EXCEPTIONS.
2. KEYWORD DENSITY: Identify the top 5 skills in the JD. Use the EXACT phrase for these skills at least 4 times throughout the CV.
3. SECTION HEADINGS: Use these EXACT headers: "PROFESSIONAL PROFILE", "WORK EXPERIENCE", "EDUCATION", "SKILLS", "PROFESSIONAL REFERENCES".
4. DATE FORMAT: Use "MM/YYYY - MM/YYYY" (e.g., "02/2023 - Present").
5. STYLE: Authoritative, senior. No cliches like "passionate" or "hard-working".

REQUIRED JSON STRUCTURE: { persona, targetJobTitle, professionalProfile, coverLetter, tailoredKeywords, experience, education, technicalToolkit }
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
  const prompt = `JD:\n${jobDescription}\n\nCV DATA:\n${JSON.stringify(masterCvData)}`;
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
  const idx = applications.findIndex((a: any) => a.jobTitle === jobTitle && a.company === company);
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
