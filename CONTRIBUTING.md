# Contributing

Thanks for considering a contribution. Issues and PRs welcome.

## Development setup

```bash
git clone <this-repo>
cd <this-repo>/frontend
npm install
npm run dev
```

The dev server is at <http://localhost:5173>. There's no backend — the app is fully client-side.

## Type-checking and build

```bash
cd frontend
./node_modules/.bin/tsc --noEmit       # type-check only
npm run build                          # full production build
```

## Adding a new AI provider

Most providers speak OpenAI's chat-completions shape. If yours does:

1. Open `frontend/src/lib/providers/index.ts`.
2. Add a `ProviderProfile` entry in the `PROVIDERS` array. Required fields:
   - `id`: short string ID (`'mistral'`, `'cohere'`, etc.)
   - `label`, `tagline`, `freeTier`, `requiresKey`
   - `models`: array of `{ id, label, recommended? }`
   - `defaultModel`
   - `keyUrl`: where users get their key
   - `keyPlaceholder`: example shape (`'sk-…'`)
   - `helpSteps`: 3-5 line walkthrough
   - `adapter: 'openai-compat'`
   - `baseUrl`: provider's chat-completions endpoint base
3. Done. Run `npm run dev` and the new provider appears in Settings + onboarding.

If your provider has a non-OpenAI API:

1. Create `frontend/src/lib/providers/<name>.ts` exporting a `ProviderAdapter` (see `anthropic.ts` and `google.ts` for examples).
2. Import it in `index.ts` and register in `ADAPTERS`.
3. Add the `ProviderProfile` with `adapter: 'your-adapter-id'`.

## Code style

- TypeScript strict mode.
- Tailwind v4 utility classes — no inline `style` outside the `.artboard` document layout.
- Prefer functional components.
- No analytics, telemetry, or third-party scripts.
- The CV/Letter `.artboard` rendering is **frozen typography**. Don't change `cv-*` classes without ATS-extraction verification (see `tools/ats-pdf-test.js`).

## ATS verification

If you change anything inside the printed CV/Letter, run the round-trip extraction test:

```bash
node tools/ats-pdf-test.js                   # generates /tmp/cv-ats-{off,on}.pdf
pdftotext -layout /tmp/cv-ats-off.pdf -      # inspect extracted text
```

The test loads a real workspace card via Puppeteer and prints both modes. Verify dates, role/company, and section headers all extract as readable words.

## Privacy invariants — do not break

- API keys MUST never be logged, sent to a third-party endpoint, or persisted outside `localStorage`.
- Master CV data MUST only be sent to the user's chosen LLM provider.
- No analytics. No tracking pixels. No third-party fonts loaded over the network (everything ships in `public/fonts/`).

PRs that violate these will be closed.

## Reporting bugs

Open an issue with:
- Browser + version
- Provider you're using
- Steps to reproduce
- A screenshot if visual

For security issues, email the maintainer directly instead of filing a public issue.
