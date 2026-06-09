# Contributing to PawLink

Thanks for your interest in contributing to PawLink.

PawLink is an open-source animal rescue intake and owner-reunification platform built for NGOs, shelters, and animal welfare organizations. The goal is simple: reduce time-to-identification and increase reunification rates for found animals.

## Project status

PawLink started as a HackDelft 2026 project and is now being hardened into a production-ready NGO tool. The codebase is active, opinionated, and still evolving quickly.

Right now, the priorities are:
- reliable intake flow
- registry lookup integrations
- matching quality
- shelter workflow UX
- auth, privacy, and multi-organization support

## Before you contribute

Please:
1. Read the `README.md`.
2. Check open issues before starting work.
3. Open an issue first for large features or architectural changes.
4. Prefer small, reviewable pull requests.

## Good first contributions

Useful areas for contribution include:
- bug fixes
- UI polish and accessibility
- test coverage
- documentation
- API contract cleanup
- mock provider improvements
- deployment and CI hardening

## Product principles

When contributing, optimize for:
- NGO-first workflows over commercial polish
- speed and clarity during rescue intake
- graceful degradation when data is incomplete
- privacy-conscious handling of owner and animal data
- open-source maintainability

## Development setup

```bash
cp .env.example .env.local
npm install
npm run seed
npm run dev
```

Then open:

- `http://localhost:3000/api/health`
- `http://localhost:3000/intake`

## Environment notes

PawLink uses:
- Next.js 15
- TypeScript
- Tailwind CSS v4
- Supabase
- pgvector
- Mistral vision APIs
- mock federation and notification providers in development

If you are contributing to local development or CI stability, prefer mock providers over live external dependencies.

## Branch naming

Use clear branch names such as:
- `feat/multi-shelter-rls`
- `fix/intake-upload-error`
- `docs/setup-clarifications`
- `chore/ci-cache`

## Pull request guidelines

A good PR should:
- do one logical thing
- include a clear description
- explain user impact
- mention tradeoffs if any
- include screenshots for UI changes
- update docs if behavior changes

PR title examples:
- `feat: add owner role guard to dashboard routes`
- `fix: handle missing chip number in lookup flow`
- `docs: clarify Supabase local setup`

## Code style

Please keep changes:
- typed
- readable
- small in scope
- easy to review

Prefer:
- explicit naming over clever abstractions
- composable helpers over deeply nested route logic
- server-safe and privacy-aware defaults

## Tests and checks

Before opening a PR, run:

```bash
npm run build
npx tsc --noEmit
```

If tests exist for the area you changed, run them too.

## Areas needing extra care

Please be cautious when changing:
- matching logic
- owner notification flows
- registry lookup behavior
- schema and migration logic
- anything affecting privacy, retention, or access control

## Design and UX

For rescue-worker flows:
- fewer clicks is better
- mobile-first matters
- loading and error states matter
- forms should be forgiving under stress
- important actions should be obvious

## Security and privacy

Do not commit:
- secrets
- live API keys
- personal data
- production database dumps

If you find a security issue, please do not open a public issue with exploit details. Contact the maintainers directly first.

## Licensing

By contributing, you agree that your contributions will be licensed under the repository’s AGPL-3.0 license.

## Questions

If something is unclear, open an issue with context before implementing. Early discussion is better than a large misaligned PR.
