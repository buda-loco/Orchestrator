# Orchestrator

**A high-fidelity Career CRM and document engine that turns a master CV into ATS-clean, editorial-quality CV + Cover Letter bundles tailored to each job description — entirely in your browser, using your own AI keys.**

Open-source. Privacy-first. Bring your own model.

---

## Why

Most AI CV tools either:
- Lock you into their model + their pricing
- Send your CV to *their* servers (and store it)
- Output bland, ATS-friendly slop with zero typographic personality

Orchestrator does the opposite: **runs in your browser**, **calls the LLM provider directly with your key**, **stores nothing on a server you don't control**, and **ships an editorial layout that still passes ATS extraction** (verified with `pdftotext`).

## Features

- **Tailoring engine** — pastes the JD, your master CV, and a strategist-grade system prompt; gets back a per-job CV + Cover Letter that explicitly answers every "Employer question" in the JD.
- **Editorial typography** — Adrianna display + body family with brutalist hierarchy. Falls back to Helvetica/Arial in optional **Maximum Compliance Mode** for hostile ATS pipelines.
- **ATS-verified** — dates print at extraction-friendly sizes, label letter-spacing is normalized in print, all section headers extract as words (not "E D U C AT I O N").
- **Application tracker** — full-screen pipeline view with status (draft / applied / rejected), days-since counter, one-click reload back into the workspace.
- **Smart export** — `Company_Role_DocumentType_YourName.pdf` filenames, 3-page CV invariant, Letter on a separate spread.
- **Multi-provider** — Gemini, Claude, OpenAI, OpenRouter, DeepSeek, Groq, Ollama (local). One key per provider, model dropdown per provider, in-app key validation.
- **Privacy by default** — keys live in `localStorage`; CV data never touches a server you don't own. The static frontend talks directly to the LLM provider via HTTPS.

## Quick start (local)

Requirements: Node 20+, npm.

```bash
git clone <this-repo>
cd <this-repo>/frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The first-run wizard will ask you to pick a provider and paste a key. That's it.

## Quick start (deploy)

Static deploy — works on any host that serves files.

```bash
cd frontend
npm install
npm run build      # outputs to frontend/dist/
```

Drop `frontend/dist/` on Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront, or any web server. No backend, no env vars, no secrets.

## AI providers

Pick whichever fits your wallet and use case. All keys live in your browser only.

| Provider | Free tier | Best for | Get a key |
|---|---|---|---|
| **Google Gemini** | ✓ Generous | Easiest start | <https://aistudio.google.com/apikey> |
| **Anthropic Claude** | — | Best at writing/tone | <https://console.anthropic.com/settings/keys> |
| **OpenAI** | — | Industry standard | <https://platform.openai.com/api-keys> |
| **OpenRouter** | ✓ Some models | One key → 100+ models | <https://openrouter.ai/keys> |
| **DeepSeek** | — | Cheap + capable | <https://platform.deepseek.com/api_keys> |
| **Groq** | ✓ Generous | Fastest inference | <https://console.groq.com/keys> |
| **Ollama** | ✓ Local | Privacy purist | <https://ollama.com/download> |

Click **Settings** in the header → pick a provider → paste key → **Test connection**. Done.

## Bring your own master CV

The repo ships with a placeholder `master-cv.example.json`. Copy it to `master-cv.json` (gitignored) and edit:

```bash
cp master-cv.example.json master-cv.json
```

Or use the **Swap Source** button in the workspace to upload a JSON file at runtime — it's stored in `localStorage` and never leaves your browser.

## Privacy

- API keys: stored in your browser's `localStorage`. Never logged. Never sent anywhere except directly to the provider's HTTPS endpoint.
- Master CV: stored in `localStorage`. Sent (over HTTPS) to your chosen provider only when you click **Execute Alignment**.
- Application tracker: stored in `localStorage`.
- The frontend has no analytics, no tracking, no third-party scripts.

If you self-host on Vercel etc., none of this changes — the host serves a static bundle and never sees your keys or data.

## Tech stack

- **React 19** + **Vite 8** + **TypeScript** + **Tailwind v4**
- **Adrianna** display & body fonts (license-cleared per repo author; replace if forking commercially)
- LLM provider SDKs replaced with raw `fetch` so the bundle stays under 80 kB gzipped
- PDF export via `window.print()` (Chrome/Safari/Firefox print-to-PDF)

## Architecture

```
frontend/
├── src/
│   ├── App.tsx                    # main UI
│   ├── components/
│   │   ├── Logo.tsx
│   │   ├── SettingsDrawer.tsx     # provider keys + model + test
│   │   └── OnboardingWizard.tsx   # first-run flow
│   ├── lib/
│   │   ├── types.ts
│   │   ├── storage.ts             # localStorage CRUD
│   │   ├── orchestrate.ts         # prompt + dispatch
│   │   └── providers/
│   │       ├── types.ts
│   │       ├── openai-compat.ts   # OpenAI / DeepSeek / OpenRouter / Groq / Ollama
│   │       ├── anthropic.ts
│   │       ├── google.ts          # Gemini
│   │       └── index.ts           # registry
│   └── styles/                    # tokens, typography, layout
└── master-cv.json                 # gitignored — your master data
```

The `backend/` folder is **deprecated** as of v5 — kept around for git history but no longer needed. Delete it after cloning if you prefer a clean tree.

## Adding a new provider

Three steps:

1. If the provider speaks OpenAI's chat-completions API, just add a `ProviderProfile` entry in `src/lib/providers/index.ts` with the right `baseUrl` and you're done.
2. Otherwise, write a new adapter in `src/lib/providers/<name>.ts` that implements `ProviderAdapter`.
3. Register the adapter in the `ADAPTERS` map.

See `src/lib/providers/anthropic.ts` and `src/lib/providers/google.ts` for non-OpenAI examples.

## Contributing

PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues with concrete reproductions get triaged fast.

## License

[MIT](./LICENSE) — fork, adapt, ship your own version. The Adrianna typeface files in `frontend/public/fonts/` are **not** part of the MIT grant; if you fork commercially, swap them for a font you have rights to.

---

Built originally for one senior creative's job hunt. Open-sourced because the architecture is generic and the world has more job hunters than CV tools that respect both typography and ATS.
