#!/usr/bin/env bash
# Create a NEW GitHub repo and push this project (needs gh auth or GITHUB_TOKEN).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OWNER="${GITHUB_OWNER:-davidelovison-hue}"
REPO="${GITHUB_REPO:-fz-table-mgmt}"
VISIBILITY="${GITHUB_VISIBILITY:-public}"

if command -v gh >/dev/null 2>&1; then
  echo "Using GitHub CLI…"
  if gh repo view "${OWNER}/${REPO}" >/dev/null 2>&1; then
    echo "Repo ${OWNER}/${REPO} already exists."
  else
    gh repo create "${OWNER}/${REPO}" --"${VISIBILITY}" --description "FZ Table Management prototype (Angular)"
  fi
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/${OWNER}/${REPO}.git"
  git push -u origin main
  exit 0
fi

TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
if [[ -z "$TOKEN" ]]; then
  cat <<'EOF'
Need either:
  • GitHub CLI:  brew install gh && gh auth login
  • Or a PAT:    export GITHUB_TOKEN=ghp_...
Optional: GITHUB_REPO=my-repo-name GITHUB_OWNER=my-user ./scripts/bootstrap-new-repo.sh
EOF
  exit 1
fi

echo "Creating repo via REST API…"
HTTP_BODY="$(mktemp)"
HTTP_CODE="$(curl -sS -o "$HTTP_BODY" -w '%{http_code}' -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${TOKEN}" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"${REPO}\",\"private\":$( [[ "$VISIBILITY" == private ]] && echo true || echo false ),\"description\":\"FZ Table Management prototype (Angular)\"}")"

if [[ "$HTTP_CODE" != "201" && "$HTTP_CODE" != "422" ]]; then
  echo "GitHub API HTTP $HTTP_CODE"
  cat "$HTTP_BODY"
  rm -f "$HTTP_BODY"
  exit 1
fi
rm -f "$HTTP_BODY"
if [[ "$HTTP_CODE" == "422" ]]; then
  echo "(Repo may already exist; continuing.)"
fi

git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${OWNER}/${REPO}.git"
git push -u origin main
