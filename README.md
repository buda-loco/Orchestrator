# The Persona Orchestrator v4.1
### A High-Fidelity Strategic Career CRM & Document Engine

The Persona Orchestrator is a full-stack professional suite designed for senior creative veterans. It transforms a static master CV into highly targeted, humanized, and architecturally designed application bundles (CV + Cover Letter) while managing the entire job search lifecycle in a spacious, full-screen command center.

---

## 🚀 Core Capabilities

### 1. Multi-Engine Orchestration
*   **Dual-AI Support:** Toggle between **Gemini 1.5 Flash** (high-speed, 1500 daily requests) and **DeepSeek V3** (deep reasoning, OpenAI-compatible).
*   **Context-Aware Tailoring:** The system injects your "Brand Pillars" and specific Job Description keywords into every sentence.
*   **Impact-Driven Logic:** The backend strictly enforces the use of measurable results (metrics, percentages, and scale) in every experience bullet point.

### 2. Full-Screen Application Tracker
*   **Pipeline Management:** A dedicated command center to track every job you've applied to.
*   **Auto-Save Reliability:** Every orchestration is automatically logged with the original Job Description, URL, and generated documents.
*   **Temporal Tracking:** An automated counter shows exactly how many days have passed since you applied to each role.
*   **Status Control:** Quick-action buttons to update your status to "Applied" or "Rejected" with visual badges.
*   **Workspace Persistence:** Reload any past application into the workspace with one click to review or re-export without wasting AI credits.

### 3. Architectural Design System
*   **Strict Monochrome:** A high-fidelity, minimalist aesthetic (Black & White) focused on understated seniority.
*   **Premium Typography:** Full integration of the **Adrianna Extended** and **Adrianna** font families.
*   **Centered Hierarchy:** Perfectly symmetrical headers with your professional SVG logo and contact stacks.
*   **Editorial Cover Letter:** Professional 12px/1.6 leading typography with a centered signature block and minimal hairline finish.
*   **Infrastructure Grid:** A dense, 4-pillar skills layout (Creative, Digital, Systems, Communication) on a dedicated Page 3.

### 4. Smart Export & ATS Compliance
*   **ATS Mode Toggle:** A real-time switch that swaps custom design fonts for standardized sans-serif (Helvetica/Arial) to ensure a 100% contiguous text layer for robots.
*   **Smart Filenames:** Automatically generates standard-compliant filenames: `Company_JobTitle_DocumentType_Benjamin_Arnedo.pdf`.
*   **Native Print liberation:** "Nuclear Purge" CSS rules ensure 3-page CVs export as 3 pages with zero blank sheets or rounding errors.
*   **Standardized Headings:** Section titles are mapped to industry-standard keywords (e.g., WORK EXPERIENCE, EDUCATION) for perfect parsing.

---

## 🛠 Tech Stack
*   **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons.
*   **Backend:** Node.js, Express, Axios.
*   **AI:** Google Gemini API & DeepSeek Chat API.
*   **Persistence:** Local JSON Database (`applications.json`) and `localStorage` for engine preferences.

---

## ⚙️ Setup & Use

1.  **Keys:** Add your `GEMINI_API_KEY` and `DEEPSEEK_API_KEY` to `backend/locals.env`.
2.  **Install:** Run `npm install` in both `frontend` and `backend` directories.
3.  **Launch:** Start the backend (`npm run dev`) and then the frontend (`npm run dev`).
4.  **Orchestrate:** 
    *   Enter Role Title, Company, and JD.
    *   Select your Engine.
    *   Hit **Execute Alignment**.
    *   Toggle **ATS Mode** if applying through a portal, or keep it off for direct emails to humans.

---

**Built by Benjamin Arnedo // Architecture v4.1**
