#!/usr/bin/env python3
import os,re,csv,json,datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
SRC = ROOT / 'src'
API_ROOT = SRC / 'app' / 'api'
DOCS.mkdir(exist_ok=True)

# 1) Deep index (md + json)
def classify(rel):
    if rel.startswith('src/app/api/'): return 'api'
    if rel.startswith('src/app/'): return 'app'
    if rel.startswith('src/components/'): return 'component'
    if rel.startswith('src/lib/'): return 'lib'
    return 'other'

def analyze_file(rel):
    txt = (ROOT / rel).read_text(encoding='utf-8')
    lines = txt.count('\n') + 1
    exports = []
    pats = [
        r'export\s+default\s+function\s+([A-Za-z0-9_]+)',
        r'export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)',
        r'export\s+const\s+([A-Za-z0-9_]+)',
        r'export\s+type\s+([A-Za-z0-9_]+)',
    ]
    for p in pats:
        exports += re.findall(p, txt)
    methods = sorted(set(re.findall(r'export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)', txt)))
    from_refs = re.findall(r'\.from\("([^"]+)"\)', txt)
    rpc_refs = ['rpc:' + x for x in re.findall(r'\.rpc\("([^"]+)"', txt)]
    supabase = sorted(set(from_refs + rpc_refs))
    env = sorted(set(re.findall(r'process\.env\.([A-Z0-9_]+)', txt)))
    return {'lines': lines, 'exports': exports, 'methods': methods, 'supabase': supabase, 'env': env}

files = []
for dp, _, fs in os.walk(SRC):
    for f in fs:
        if f.endswith(('.ts', '.tsx', '.mjs')):
            files.append(str((Path(dp) / f).relative_to(ROOT)))
files = sorted(files)

idx = {rel: analyze_file(rel) for rel in files}

json_out = {
    'generatedAt': datetime.date.today().isoformat(),
    'files': idx,
    'crossCutting': {
        'supabaseRefs': sorted(set(t for a in idx.values() for t in a['supabase'])),
        'envVars': sorted(set(e for a in idx.values() for e in a['env'])),
    }
}
(DOCS / 'repo-deep-index.json').write_text(json.dumps(json_out, indent=2) + '\n', encoding='utf-8')

md = []
md.append('# Repo Deep Index - Plant Challenge\n')
md.append(f'Last updated: {datetime.date.today().isoformat()}\n')
for sec in ['app', 'api', 'component', 'lib', 'other']:
    group = [r for r in files if classify(r) == sec]
    if not group:
        continue
    md.append(f'## {sec.upper()} files ({len(group)})')
    for rel in group:
        a = idx[rel]
        bits = [f"{a['lines']} lines"]
        if a['methods']:
            bits.append('methods:' + ','.join(a['methods']))
        if a['exports']:
            shown = ', '.join(a['exports'][:6]) + ('...' if len(a['exports']) > 6 else '')
            bits.append('exports:' + shown)
        if a['supabase']:
            bits.append('db:' + ', '.join(a['supabase']))
        if a['env']:
            bits.append('env:' + ', '.join(a['env']))
        md.append(f"- `{rel}` - " + ' | '.join(bits))
    md.append('')

md.append('## Cross-cutting extracted references')
md.append('- Supabase tables/RPC: ' + ', '.join(json_out['crossCutting']['supabaseRefs']))
md.append('- Env vars: ' + ', '.join(json_out['crossCutting']['envVars']))
md.append('')
md.append('## Regenerate')
md.append('- Run: `python3 scripts/refresh-architecture-docs.py`')
(DOCS / 'repo-deep-index.md').write_text('\n'.join(md) + '\n', encoding='utf-8')

# 2) DB access matrix
rows = []
for dp, _, fs in os.walk(SRC):
    for f in fs:
        if not f.endswith(('.ts', '.tsx')):
            continue
        rel = str((Path(dp) / f).relative_to(ROOT))
        txt = (ROOT / rel).read_text(encoding='utf-8')
        for m in re.finditer(r'\.from\("([^"]+)"\)\s*\n?\s*\.(select|insert|update|delete|upsert)', txt):
            rows.append((rel, m.group(1), m.group(2)))
        for m in re.finditer(r'\.rpc\("([^"]+)"', txt):
            rows.append((rel, 'rpc:' + m.group(1), 'call'))
with (DOCS / 'db-access-matrix.csv').open('w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['file', 'table_or_rpc', 'operation'])
    for r in sorted(set(rows)):
        w.writerow(r)

# 3) API contracts deep
contracts = []
for dp, _, fs in os.walk(API_ROOT):
    for f in fs:
        if f != 'route.ts':
            continue
        rel = str((Path(dp) / f).relative_to(ROOT))
        txt = (ROOT / rel).read_text(encoding='utf-8')
        methods = re.findall(r'export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)', txt)
        statuses = sorted(set(re.findall(r'status:\s*(\d{3})', txt)))
        errs = sorted(set(re.findall(r'\{\s*error:\s*"([^"]+)"', txt)))
        env = sorted(set(re.findall(r'process\.env\.([A-Z0-9_]+)', txt)))
        auth_required = 'supabase.auth.getUser()' in txt
        body_fields = sorted(set(re.findall(r'const\s*\{\s*([^}]+)\s*\}\s*=\s*body', txt)))
        parsed_fields = []
        for bf in body_fields:
            parsed_fields += [x.strip().split(':')[0].replace('?', '') for x in bf.split(',')]
        parsed_fields = sorted(set([x for x in parsed_fields if x]))
        contracts.append({
            'route': '/' + rel.split('src/app/')[1].replace('/route.ts', ''),
            'file': rel,
            'methods': methods,
            'authRequired': auth_required,
            'requestFieldsInCode': parsed_fields,
            'statusCodes': statuses,
            'errorMessages': errs,
            'env': env,
        })

(DOCS / 'api-contracts-deep.json').write_text(json.dumps(contracts, indent=2) + '\n', encoding='utf-8')
md = ['# API Contracts - Deep Pass\n', f'Last updated: {datetime.date.today().isoformat()}\n',
      'Generated from route implementations. This is code-derived and should be treated as source-aligned reference.\n']
for c in sorted(contracts, key=lambda x: x['route']):
    md.append(f"## `{c['route']}`")
    md.append(f"- File: `{c['file']}`")
    md.append(f"- Methods: {', '.join(c['methods']) if c['methods'] else 'n/a'}")
    md.append(f"- Auth required: {'yes' if c['authRequired'] else 'no/conditional'}")
    md.append(f"- Request fields observed: {', '.join(c['requestFieldsInCode']) if c['requestFieldsInCode'] else 'none or query-only'}")
    md.append(f"- Status codes observed: {', '.join(c['statusCodes']) if c['statusCodes'] else 'implicit 200 only'}")
    md.append(f"- Error messages observed: {('; '.join(c['errorMessages'])) if c['errorMessages'] else 'none literal'}")
    md.append(f"- Env vars: {', '.join(c['env']) if c['env'] else 'none'}")
    md.append('')

md.append('## Telemetry semantics for `/api/recognize` and `/api/sage`')
md.append('- Log event name: `api_telemetry`')
md.append('- Fields: `endpoint`, `status_code`, `latency_ms`, `timeout`, `fallback_used`, `parse_failed`, `request_size_bucket`')
md.append('- `timeout` is true only for request abort timeout paths.')
md.append('- `fallback_used` applies to Sage when malformed provider output triggers deterministic fallback response.')
md.append('- `parse_failed` indicates provider payload or model payload parse failure and never logs request payload content.')
(DOCS / 'api-contracts-deep.md').write_text('\n'.join(md) + '\n', encoding='utf-8')

# 4) Architecture bible (regenerate)
journeys = {
 'Auth': ['src/app/auth/page.tsx','src/app/auth/callback/route.ts','src/lib/supabase/middleware.ts','src/components/ProtectedLayout.tsx'],
 'Home Dashboard': ['src/app/(protected)/page.tsx','src/components/ProgressBar.tsx','src/components/PlantCard.tsx'],
 'Add Plant': ['src/app/(protected)/add/page.tsx','src/components/PhotoRecognitionModal.tsx','src/app/api/recognize/route.ts'],
 'Circles': ['src/app/(protected)/circles/page.tsx','src/app/(protected)/circles/[id]/page.tsx','src/app/(protected)/circles/create/page.tsx','src/app/(protected)/circles/[id]/settings/page.tsx','src/lib/circles.ts'],
 'Sage Assistant': ['src/app/(protected)/sage/page.tsx','src/components/SageChat.tsx','src/app/api/sage/route.ts','src/lib/ai/sageRules.ts'],
 'Profile & Members': ['src/app/(protected)/profile/page.tsx','src/components/MemberSwitcher.tsx','src/components/AddKidModal.tsx','src/components/ProtectedLayout.tsx'],
}

def db_ops(txt):
    out=[]
    for m in re.finditer(r'\.from\("([^"]+)"\)\s*\n?\s*\.(select|insert|update|delete|upsert)',txt):
        out.append((m.group(1),m.group(2)))
    for m in re.finditer(r'\.rpc\("([^"]+)"',txt):
        out.append((f'rpc:{m.group(1)}','call'))
    return out

def api_calls(txt):
    return sorted(set(m.group(2) for m in re.finditer(r'fetch\(("|\")(\/api\/[^"]+)',txt)))

b=['# Architecture Bible - Plant Challenge\n', f'Last updated: {datetime.date.today().isoformat()}\n',
   'This is a high-signal onboarding map from user journeys to UI, API, and data interactions.\n']
for j, fl in journeys.items():
    b.append(f'## {j}')
    b.append('Key files:')
    for f in fl:
        b.append(f'- `{f}`')
    all_db=[]; all_api=[]
    for f in fl:
        p=ROOT/f
        if p.exists():
            t=p.read_text(encoding='utf-8')
            all_db.extend(db_ops(t)); all_api.extend(api_calls(t))
    if all_api:
        b.append('Client -> API calls:')
        for a in sorted(set(all_api)): b.append(f'- `{a}`')
    if all_db:
        b.append('Data operations inferred:')
        for t,op in sorted(set(all_db)): b.append(f'- `{t}` -> `{op}`')
    b.append('')
b.append('## API Contract Index (quick)')
for c in sorted(contracts,key=lambda x:x['file']):
    b.append(f"- `{c['file']}` | methods: {', '.join(c['methods']) if c['methods'] else 'n/a'} | status codes: {', '.join(c['statusCodes']) if c['statusCodes'] else 'n/a'} | env: {', '.join(c['env']) if c['env'] else 'none'}")
(DOCS / 'architecture-bible.md').write_text('\n'.join(b) + '\n', encoding='utf-8')


# 5) Generated sequence diagrams
sequence_mmd = """sequenceDiagram
    autonumber

    title Auth Flow
    participant U as User
    participant A as Auth Page
    participant SB as Supabase
    participant MW as Middleware
    U->>A: submit credentials
    A->>SB: signInWithPassword()
    SB-->>A: session
    A->>MW: navigate protected route
    MW-->>U: allow or redirect /auth

    title Add / Log Flow
    participant Add as Add Page
    participant Rec as /api/recognize
    participant OR as OpenRouter
    participant DB as Supabase DB
    U->>Add: upload photo
    Add->>Rec: POST image data URL
    Rec->>OR: vision completion
    OR-->>Rec: recognized plants JSON
    Rec-->>Add: normalized plants
    Add->>DB: insert plant_log rows
    DB-->>Add: success

    title Circles Join + Scoring
    participant Join as Join UI
    participant RPC as rpc:join_circle
    participant Tr as DB Triggers
    participant Feed as circle_activity
    U->>Join: enter invite code
    Join->>RPC: join_circle(code, member_id)
    RPC-->>Join: circle membership result
    U->>DB: log plant
    DB->>Tr: evaluate milestones
    Tr->>Feed: insert hit_30/new_lifetime event

    title Sage Query Path
    participant SageUI as SageChat
    participant SageAPI as /api/sage
    participant Rules as deterministic rules
    participant Model as OpenRouter LLM
    U->>SageUI: ask question
    SageUI->>SageAPI: POST question + context
    SageAPI->>Rules: deterministic match?
    alt deterministic hit
      Rules-->>SageAPI: response
    else fallback mode or no match
      SageAPI->>Model: completion request
      Model-->>SageAPI: JSON response
    end
    SageAPI-->>SageUI: Sage response + mode header
"""
(DOCS / 'sequence-diagrams.mmd').write_text(sequence_mmd + '\n', encoding='utf-8')
(DOCS / 'sequence-diagrams.md').write_text('# Sequence Diagrams\n\nGenerated from baseline architecture flows.\n\n```mermaid\n' + sequence_mmd + '\n```\n', encoding='utf-8')

print('refreshed architecture docs')
