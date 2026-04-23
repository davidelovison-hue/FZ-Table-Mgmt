#!/usr/bin/env bash
# Create the GitHub repo for this project (PAT required — this agent has no access to your account).
#
#   export GITHUB_TOKEN=ghp_xxxxxxxx
#   npm run github:create-repo
#
# Token: GitHub → Settings → Developer settings → Personal access tokens
# Classic: enable "repo". Fine-grained: repository access + Contents read/write.

set -euo pipefail
REPO="feverzone-guestlist"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Missing GITHUB_TOKEN."
  echo "  export GITHUB_TOKEN=ghp_..."
  echo "  npm run github:create-repo"
  exit 1
fi

echo "Creating repo \"${REPO}\" for the authenticated user …"
RESP=$(curl -sS -w "\n%{http_code}" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/user/repos" \
  -d "{\"name\":\"${REPO}\",\"private\":false,\"description\":\"Fever Zone guestlist / hubs prototype\",\"auto_init\":false}")

HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [[ "$HTTP" == "201" ]]; then
  URL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('html_url',''))" 2>/dev/null || true)
  echo "Created: ${URL:-https://github.com/<you>/${REPO}}"
  echo "Next: npm run push-and-deploy"
  exit 0
fi

if [[ "$HTTP" == "422" ]] && echo "$BODY" | grep -qi "already exists"; then
  echo "Repo name already exists on this account — safe to continue."
  echo "Next: npm run push-and-deploy"
  exit 0
fi

echo "GitHub API error (HTTP ${HTTP}):"
echo "$BODY" | head -c 1200
echo
exit 1
