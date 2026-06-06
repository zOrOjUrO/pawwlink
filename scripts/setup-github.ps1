# One-shot publish for Windows / PowerShell (no WSL needed). Requires gh:  gh auth login
# Usage:  pwsh scripts/setup-github.ps1 -Repo pawlink -Visibility private
param(
  [string]$Repo = "pawlink",
  [ValidateSet("private","public")][string]$Visibility = "private"
)
$ErrorActionPreference = "Stop"

# 1. Ensure a git repo with one commit.
if (-not (Test-Path .git)) { git init | Out-Null }
if (-not (git config user.name))  { git config user.name  "Gokul" }
if (-not (git config user.email)) { git config user.email "gokulash99@gmail.com" }
git rev-parse --verify HEAD 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  git add -A
  git commit -m "PawLink: AI animal-rescue intake platform (vision + DB + federation + notify, web MVP)" | Out-Null
}

# 2. Create the repo and push.
Write-Host "Creating GitHub repo '$Repo' ($Visibility) and pushing..."
gh repo create $Repo "--$Visibility" --source=. --remote=origin --push

# 3. Labels (best effort).
foreach ($l in @("area:apps","area:vision","area:backend","area:infra","area:quality","owner:gokul","owner:maaz")) {
  gh label create $l 2>$null | Out-Null
}

# 4. Issues.
function New-Issue($title, $body, $labels) {
  try { gh issue create --title $title --body $body --label $labels | Out-Null }
  catch { gh issue create --title $title --body $body | Out-Null }
  Write-Host "  + $title"
}
Write-Host "Opening issues..."
New-Issue "Owner mobile app - register & reunify" "Register pets (photo + chip + contact), receive match notifications, confirm/claim. App talks only to /api/*." "area:apps,owner:gokul"
New-Issue "Rescue-worker app (native/PWA)" "Camera intake, offline queue + sync, passport & triage view, one-tap notify, shelter dashboard." "area:apps,owner:gokul"
New-Issue "Auth & roles" "Supabase Auth; owner / rescue-worker / shelter-admin roles + row-level security." "area:apps,owner:gokul"
New-Issue "Real embeddings (CLIP/DINOv2)" "Replace deterministic fallback with semantic 512-d vectors; verify EMBEDDING_DIM; benchmark precision/recall." "area:vision,owner:maaz"
New-Issue "Dedicated breed classifier" "Augment/replace Pixtral breed field; confidence audit." "area:vision,owner:maaz"
New-Issue "Triage calibration" "Validate severity 0-3 against vet-labelled samples." "area:vision,owner:maaz"
New-Issue "Integrate real registries" "Live Amivedi/NDG/PetBase clients behind runFederatedQuery; caching, rate limits, per-source fallback to mock." "area:backend"
New-Issue "Real notifications" "Twilio SMS + WhatsApp + web push behind the Notifier interface; receipts, retries, opt-in/out." "area:backend"
New-Issue "GDPR/compliance" "PII minimization, consent, retention, audit log, EU residency, right-to-erasure." "area:backend"
New-Issue "DB migration & RLS" "Align live animals/owners with schema.sql; create match_animals RPC; pgvector index tuning; RLS." "area:backend"
New-Issue "CI/CD pipeline" "Build is wired in .github/workflows/ci.yml; add Vercel deploy + Supabase migrations." "area:infra"
New-Issue "Test coverage" "e2e intake->match->notify; seed fixtures; error-state coverage." "area:quality"

Write-Host "Done -> gh repo view --web"
