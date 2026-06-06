#!/usr/bin/env bash
# One-shot publish: init git (if needed) -> create GitHub repo -> push -> open issues.
#
# Prereqs (run on your machine, not in CI):
#   - GitHub CLI installed & authenticated:  gh auth login
#   - Run from the project root:              bash scripts/setup-github.sh [repo-name] [private|public]
set -euo pipefail

REPO="${1:-pawlink}"
VIS="${2:-private}"

# 1. Ensure a git repo with at least one commit.
if [ ! -d .git ]; then
  git init -q
fi
git config user.name  >/dev/null 2>&1 || git config user.name  "Gokul"
git config user.email >/dev/null 2>&1 || git config user.email "gokulash99@gmail.com"
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  echo "Repo already has commits — skipping initial commit."
else
  git add -A
  git commit -q -m "PawLink: AI animal-rescue intake platform (vision + DB + federation + notify, web MVP)"
fi

# 2. Create the GitHub repo from this directory and push.
echo "Creating GitHub repo '$REPO' ($VIS) and pushing..."
gh repo create "$REPO" --"$VIS" --source=. --remote=origin --push

# 3. Labels (best effort — ignore if they already exist).
for l in "area:apps" "area:vision" "area:backend" "area:infra" "area:quality" "owner:gokul" "owner:maaz"; do
  gh label create "$l" >/dev/null 2>&1 || true
done

# 4. Issues. Falls back to no-label if labels are unavailable.
mk() {
  gh issue create --title "$1" --body "$2" --label "$3" >/dev/null 2>&1 \
    || gh issue create --title "$1" --body "$2" >/dev/null
  echo "  + $1"
}
echo "Opening issues..."
mk "Owner mobile app — register & reunify" "Register pets (photo + chip + contact), receive match notifications, confirm/claim. App talks only to /api/*." "area:apps,owner:gokul"
mk "Rescue-worker app (native/PWA)" "Camera intake, offline queue + sync, passport & triage view, one-tap notify, shelter dashboard." "area:apps,owner:gokul"
mk "Auth & roles" "Supabase Auth; owner / rescue-worker / shelter-admin roles + row-level security." "area:apps,owner:gokul"
mk "Real embeddings (CLIP/DINOv2)" "Replace deterministic fallback with semantic 512-d vectors; verify EMBEDDING_DIM; benchmark precision/recall." "area:vision,owner:maaz"
mk "Dedicated breed classifier" "Augment/replace Pixtral breed field; confidence audit." "area:vision,owner:maaz"
mk "Triage calibration" "Validate severity 0-3 against vet-labelled samples." "area:vision,owner:maaz"
mk "Integrate real registries" "Live Amivedi/NDG/PetBase clients behind runFederatedQuery; caching, rate limits, per-source fallback to mock." "area:backend"
mk "Real notifications" "Twilio SMS + WhatsApp + web push behind the Notifier interface; receipts, retries, opt-in/out." "area:backend"
mk "GDPR/compliance" "PII minimization, consent, retention, audit log, EU residency, right-to-erasure." "area:backend"
mk "DB migration & RLS" "Align live animals/owners with schema.sql; create match_animals RPC; pgvector index tuning; RLS." "area:backend"
mk "CI/CD pipeline" "GitHub Action: typecheck + test + build; Vercel deploy; Supabase migrations." "area:infra"
mk "Test coverage" "e2e intake->match->notify; seed fixtures; error-state coverage." "area:quality"

echo "Done → gh repo view --web"
