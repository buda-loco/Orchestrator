# The Persona Orchestrator - Claude Code Configuration

## Context

The Persona Orchestrator is a high-fidelity Strategic Career CRM and document engine. It transforms a master CV into highly targeted, humanized application bundles (CV + Cover Letter), and tracks the entire job-search pipeline in a full-screen command center.

**Tech Stack**: React 19, Vite, TailwindCSS 4, Node.js, Express, Google Generative AI (Gemini 1.5 Flash), DeepSeek V3, Puppeteer, html2canvas, jsPDF

**Core Principle**: Impact-driven CV/CL generation — every bullet must carry measurable results, every layout must respect ATS parsing AND editorial typography.

**Last Updated**: 2026-04-27
**Navigator Version**: 5.2.0

---

## Navigator Quick Start

**Every session begins with**:
```
"Start my Navigator session"
```

This loads `.agent/DEVELOPMENT-README.md` (project navigator) which provides:
- Documentation index and "when to read what" guide
- Quick start guides and integration status

**Core workflow**:
1. **Start session** → Loads navigator automatically
2. **Load task docs** → Only what's needed for current work
3. **Implement** → Follow project patterns below
4. **Document** → "Archive TASK-XX documentation" when complete
5. **Compact** → "Clear context and preserve markers" after isolated tasks

---

## Project-Specific Code Standards

### General Standards
- **Architecture**: KISS, DRY, SOLID
- **TypeScript**: Strict mode
- **Line Length**: Max 100 characters
- **No inline styles**: Tailwind utility classes only

### Frontend (React 19 + Vite + Tailwind v4) — the entire app, no backend
- Functional components only, no classes
- Tailwind v4 utility-first; design tokens for the monochrome system
- Adrianna Extended (display) + Adrianna (body) typography
- ATS Mode toggle MUST swap to Helvetica/Arial system fonts to preserve a contiguous text layer
- PDF export: native window.print() against the print CSS; the export route never leaves the browser
- Strict 3-page CV layout — verify "Nuclear Purge" print CSS still passes after changes

### LLM orchestration (browser-side)
- All provider calls live in `frontend/src/lib/providers/*` — one adapter per provider, sharing a `ProviderAdapter` interface
- The single orchestration entrypoint is `frontend/src/lib/orchestrate.ts`; system prompt is exported from there
- API keys live in localStorage only — never log them, never include them in error messages, never put them in URL query strings
- Every AI prompt MUST inject Brand Pillars + JD keywords; refuse to ship prompts without metric/scale guardrails

---

## Forbidden Actions

### Navigator Violations
- ❌ NEVER load all `.agent/` docs at once (defeats token optimization)
- ❌ NEVER skip reading DEVELOPMENT-README.md navigator
- ❌ NEVER skip documentation after meaningful features

### General Violations
- ❌ No Claude Code mentions in commits/code
- ❌ Never commit API keys, the personal `master-cv.json`, or `applications.json`
- ❌ Never put API keys in URL query strings (always headers — see `providers/google.ts` for the pattern)
- ❌ No package.json modifications without approval
- ❌ Don't break the 3-page CV invariant or remove ATS mode

---

## Documentation Structure

```
.agent/
├── DEVELOPMENT-README.md      # Navigator (always load first)
├── tasks/                     # Implementation plans
├── system/                    # Architecture docs
└── sops/                      # Standard Operating Procedures
    ├── integrations/          # Gemini, DeepSeek, Puppeteer
    ├── debugging/             # Print/PDF/ATS issues
    ├── development/           # Local dev, schema changes
    └── deployment/            # Production rollout
```

**Token-efficient loading**:
- Navigator: ~2k tokens (always)
- Current task: ~3k tokens (as needed)
- System docs: ~5k tokens (when relevant)
- SOPs: ~2k tokens (if required)
- **Total**: ~12k vs ~150k

---

## Project Management Integration

**Configured Tool**: None (manual task tracking via `.agent/tasks/`)

---

## Configuration

Navigator config in `.agent/.nav-config.json`:

```json
{
  "version": "5.2.0",
  "project_management": "none",
  "task_prefix": "TASK",
  "team_chat": "none",
  "auto_load_navigator": true,
  "compact_strategy": "conservative"
}
```

---

## Commit Guidelines

- **Format**: `type(scope): description`
- **Types**: feat, fix, docs, refactor, test, chore
- Concise and descriptive
- No Claude Code mentions

---

## Success Metrics

### Context Efficiency
- <70% token usage for typical tasks
- <12k tokens loaded per session
- 10+ exchanges without compact

### Documentation Coverage
- 100% completed features have task docs
- 90%+ integrations have SOPs
- System docs updated within 24h

---

**For complete Navigator documentation**:
- `.agent/DEVELOPMENT-README.md` (project navigator)
