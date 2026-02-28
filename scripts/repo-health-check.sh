#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p .lobster

run_step () {
  local name="$1"
  local cmd="$2"
  local log=".lobster/${name}.log"
  echo "\n=== ${name} ==="
  echo "$ ${cmd}"
  if bash -lc "$cmd" >"$log" 2>&1; then
    echo "PASS ${name}"
  else
    code=$?
    echo "FAIL ${name} (exit ${code})"
  fi
}

run_step git_status "git status --short --branch"
run_step deps_audit "npm audit --json || true"
run_step lint "CI=1 npm run lint"
run_step build "CI=1 npm run build"
run_step e2e "CI=1 npx playwright test --config=e2e/playwright.config.ts --reporter=line --max-failures=2 --global-timeout=600000"

node - <<'NODE'
const fs=require('fs');
const steps=['git_status','deps_audit','lint','build','e2e'];
const lines=['# Repo health summary',''];
for (const s of steps){
  const p=`.lobster/${s}.log`;
  let status='unknown';
  if (fs.existsSync(p)){
    const t=fs.readFileSync(p,'utf8');
    if (/\bFAIL\b|\berror\b|\bError\b|\bfailed\b/i.test(t)) status='issues found';
    else status='ok/needs review';
  }
  lines.push(`- ${s}: ${status} (log: ${p})`);
}
fs.writeFileSync('.lobster/last-run-summary.md',lines.join('\n')+'\n');
console.log('Wrote .lobster/last-run-summary.md');
NODE

echo "\nDone. Logs: .lobster/*.log"
