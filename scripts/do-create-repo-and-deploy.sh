#!/usr/bin/env bash
# One-shot: create github.com/<you>/feverzone-guestlist (if missing), push main, deploy GitHub Pages.
# Uses GITHUB_TOKEN if set; otherwise tries `git credential fill` for github.com (HTTPS helper / Keychain).

set -euo pipefail
cd "$(dirname "$0")/.."
REPO="feverzone-guestlist"

resolve_token() {
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    printf '%s' "$GITHUB_TOKEN"
    return
  fi
  local creds token
  creds=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null || true)
  token=$(echo "$creds" | awk -F= '/^password=/{print substr($0,10)}' | head -1)
  if [[ -n "$token" ]]; then
    printf '%s' "$token"
    return
  fi
  return 1
}

TOKEN=$(resolve_token) || {
  echo "No GitHub token: set GITHUB_TOKEN, or save HTTPS credentials for github.com (e.g. git clone over HTTPS once)."
  exit 1
}

echo "Creating ${REPO} on GitHub (if it does not exist) …"
RESP=$(curl -sS -w "\n%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/user/repos" \
  -d "{\"name\":\"${REPO}\",\"private\":false,\"description\":\"Fever Zone guestlist / hubs prototype\",\"auto_init\":false}")

HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [[ "$HTTP" == "201" ]]; then
  echo "Repository created."
elif [[ "$HTTP" == "422" ]] && echo "$BODY" | grep -qi "already exists"; then
  echo "Repository already exists — continuing."
else
  echo "GitHub API error (HTTP ${HTTP}):"
  echo "$BODY" | head -c 900
  echo
  exit 1
fi

echo "Pushing main → origin …"
git push -u origin main

echo "Building and publishing gh-pages …"
npm run deploy:gh-pages

echo ""
echo "Done. Enable Pages if needed: repo → Settings → Pages → branch gh-pages, / (root)."
echo "Site (after Pages is on): https://davidelovison-hue.github.io/${REPO}/"
