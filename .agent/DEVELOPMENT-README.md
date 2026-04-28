# The Persona Orchestrator - Development Documentation Navigator

**Project**: High-Fidelity Strategic Career CRM & Document Engine. Transforms a master CV into targeted, humanized application bundles (CV + Cover Letter) and manages the entire job search lifecycle.
**Tech Stack**: React 19, Vite, TailwindCSS 4, Node.js, Express, Google Generative AI (Gemini), DeepSeek API, Puppeteer
**Updated**: 2026-04-27

---

## 🚀 Quick Start for Development

### New to This Project?
**Read in this order:**
1. [Project Architecture](./system/project-architecture.md) - Tech stack, structure, patterns
2. [Tech Stack Patterns](./system/tech-stack-patterns.md) - Framework-specific patterns
3. [Workflow Guide](./system/workflow.md) - Development workflow

### Starting a New Feature?
1. Check if similar task exists in [`tasks/`](#implementation-plans-tasks)
2. Read relevant system docs from [`system/`](#system-architecture-system)
3. Check for integration SOPs in [`sops/`](#standard-operating-procedures-sops)
4. Generate implementation plan with `/nav:update-doc feature TASK-XX`

### Fixing a Bug?
1. Check [`sops/debugging/`](#debugging) for known issues
2. Review relevant system docs for context
3. After fixing, create SOP: `/nav:update-doc sop debugging [issue-name]`

---

## 📂 Documentation Structure

```
.agent/
├── DEVELOPMENT-README.md     ← You are here (navigator)
│
├── tasks/                    ← Implementation plans
│   └── TASK-XX-feature.md
│
├── system/                   ← Living architecture documentation
│   ├── project-architecture.md
│   └── tech-stack-patterns.md
│
└── sops/                     ← Standard Operating Procedures
    ├── integrations/         # Gemini, DeepSeek, Puppeteer guides
    ├── debugging/            # Common issues and solutions
    ├── development/          # Local dev, CV/CL generation flow
    └── deployment/           # Deployment procedures
```

---

## 📖 Documentation Index

### System Architecture (`system/`)

#### Project Architecture
**When to read**: Starting work, understanding overall structure

**Will contain**:
- Frontend (React/Vite) and Backend (Express) split
- AI engine orchestration (Gemini ↔ DeepSeek)
- Application tracker persistence (`applications.json`)
- PDF/ATS export pipeline (html2canvas + jsPDF + Puppeteer)
- Master CV data model (`master-cv.json`)

#### Tech Stack Patterns
**When to read**: Implementing new components/features

**Will contain**:
- React 19 + Vite patterns
- Tailwind v4 design tokens (monochrome system)
- Adrianna typography integration
- Express route conventions
- Prompt engineering guardrails (impact-driven, metrics-required)

---

### Implementation Plans (`tasks/`)

**Format**: `TASK-XX-feature-slug.md`

**Template structure**:
```markdown
# TASK-XX: [Feature Name]

## Context
[Why building this]

## Implementation Plan
### Phase 1: [Name]
- [ ] Sub-task

## Technical Decisions
[Framework choices, patterns used]

## Completion Checklist
- [ ] All sub-tasks completed
- [ ] System docs updated
- [ ] Tested end-to-end (Gemini + DeepSeek paths)
```

---

### Standard Operating Procedures (`sops/`)

#### Integrations (`sops/integrations/`)
- Gemini API setup and key rotation
- DeepSeek API integration
- Puppeteer headless rendering for ATS export

#### Debugging (`sops/debugging/`)
- Pagination/print rendering issues
- ATS mode font fallback
- AI engine timeouts and quota errors

#### Development (`sops/development/`)
- Local dev (backend + frontend dual launch)
- Adding a new "Brand Pillar" or persona
- Master CV schema migrations

#### Deployment (`sops/deployment/`)
- Environment variable management (`backend/locals.env`)
- Production build (Vite + Express)

---

## 🔄 When to Read What

### Scenario: Adding a new AI engine
1. Read `sops/integrations/` for prior engine integrations
2. Review `system/project-architecture.md` (orchestration layer)
3. Review prompt engineering patterns
4. Implement, then create new SOP

### Scenario: Tweaking PDF/CV layout
1. Check `sops/debugging/` for known print issues
2. Review `system/tech-stack-patterns.md` (Tailwind + print CSS)
3. Test ATS mode toggle end-to-end

### Scenario: Context Optimization
1. Load only `DEVELOPMENT-README.md` (~2k tokens)
2. Load current task doc (~3k tokens)
3. Load needed system doc (~5k tokens)
4. Reference SOPs on-demand

**Total**: ~12k tokens vs ~150k loading everything

---

## 📊 Token Optimization Strategy

**Always load**: `DEVELOPMENT-README.md` (~2k)
**Load for current work**: Task doc (~3k)
**Load as needed**: System doc (~5k)
**Load if required**: SOP (~2k)

**Total**: ~12k tokens (92% savings)

---

## ✅ Documentation Quality Checklist

### When Creating Task Doc
- [ ] Context explains WHY building this
- [ ] Implementation broken into phases
- [ ] Both AI engine paths considered (Gemini + DeepSeek)
- [ ] ATS mode impact noted
- [ ] Completion checklist comprehensive

### When Creating SOP
- [ ] Clear context (when/why needed)
- [ ] Step-by-step solution
- [ ] Code examples included
- [ ] Prevention checklist

---

**Last Updated**: 2026-04-27
**Powered By**: Navigator v5.2.0
