# Contributing & Work Split

Two-person team. Keep PRs small, branch per issue (`feat/<area>-<short>`), and update the
relevant subsystem README when behavior changes.

## Ownership
| Area | Owner |
|------|-------|
| Owner & rescue-worker apps, auth/roles | **Gokul** |
| Vision model (breed classifier, embeddings, triage calibration) | **Maaz** |
| Platform/backend (federation, notifications, DB, infra) | **Shared** |

## Conventions
- TypeScript throughout. The passport contract lives in `lib/vision/types.ts`
  (`PassportResult`) — coordinate any change to it.
- `npm run build` (typecheck) must pass before merge.
- Secrets only in `.env.local` (never committed). `NEXT_PUBLIC_*` is the only client-exposed prefix.

## Labels
`area:apps` · `area:vision` · `area:backend` · `area:infra` · `area:quality` ·
`owner:gokul` · `owner:maaz` · `good-first-issue`

See `docs/ISSUES.md` for the seed backlog (created via `scripts/setup-github.sh`).
