# SonicJS Community Website Template – AI Agent Instructions

Purpose: Enable AI agents to perform safe, context-aware changes quickly. Focus on domain-driven config, infra/app symmetry, and documentation-first workflow (see `/.github/instructions/DocumentationPolicy.instructions.md`).

## Core Architecture (Big Picture)
Monorepo couples two Cloudflare Workers (CMS + SSR frontend) sharing D1/KV/R2. Resource names derive ONLY from `project.config.json` (never hard‑code). Terraform provisions storage + DNS; Wrangler deploys code. Data path: Browser → Astro Worker (SSR) → SonicJS CMS API → (KV cache | D1) + R2 for media.

Key dirs:
- `apps/admin-sonicjs/` (API + content workflow)
- `apps/web-astro/` (SSR + fetch to admin API)
- `infra/` (Terraform: KV, D1, R2, DNS)
- `scripts/setup.js` (single source for naming + regeneration)

## Domain-Based Configuration System
Single authoritative input: domain → deterministic names. Re-run `scripts/setup.js` to rotate domain; do NOT manually drift Terraform or Wrangler names.

```bash
# Setup generates ALL configurations from domain
node scripts/setup.js community.com "My Community Site"
```

Example (domain `community.com`): project `community`, DB `community_db`, KV `COMMUNITY_PUBLISHED`, R2 `community-media`, workers `community-web` / `community-admin`, hostnames `community.com` / `admin.community.com`.

Flow: (1) generate `project.config.json` → (2) regenerate Terraform + Wrangler + package manifests → (3) CI substitutes `{{D1_DATABASE_ID}}`, `{{KV_NAMESPACE_ID}}`, etc.

## Developer Workflows
Initial setup (order is enforced by dependencies):
```bash
# 1. Generate project configuration
node scripts/setup.js yourdomain.com "Description"

# 2. Update Cloudflare IDs in project.config.json
# 3. Deploy infrastructure
cd infra && terraform apply

# 4. Deploy CMS with migrations
cd apps/admin-sonicjs && npm install && npm run migrate && npm run deploy

# 5. Deploy frontend  
cd apps/web-astro && npm install && npm run build && npm run deploy
```

Local dev (two Workers; keep ports consistent with docs):
```bash
# Terminal 1: CMS on localhost:8787
cd apps/admin-sonicjs && npm run dev

# Terminal 2: Frontend on localhost:8788  
cd apps/web-astro && npm run dev
```

Common tasks:
```bash
# Database operations
wrangler d1 execute {{DB_NAME}} --command "SELECT * FROM posts;"

# Clear KV cache
wrangler kv:bulk delete --namespace-id {{KV_NAMESPACE_ID}}

# Upload to R2
wrangler r2 object put {{R2_BUCKET}}/file.jpg --file ./file.jpg
```

## Runtime & Bindings Patterns
Both Workers must expose identical bindings (`DB`, `PUBLISHED`, `MEDIA`) to keep portability. Never rename bindings in only one app. Placeholders (`{{...}}`) remain until CI injects Terraform outputs.

Env vars:
- CMS: `ADMIN_HOST`, `CORS_ORIGIN`, `PROJECT_NAME`
- Frontend: `ADMIN_API`, `SITE_URL`, `PROJECT_NAME`

Local env suggestion (not committed):
`apps/admin-sonicjs/.env.local` → ADMIN_HOST=localhost:8787, CORS_ORIGIN=http://localhost:8788
`apps/web-astro/.env.local` → ADMIN_API=http://localhost:8787/api, SITE_URL=http://localhost:8788

## SonicJS CMS
Collections + roles live in `sonic.config.mjs` (extend, never inline patch inside code). Workflow statuses power KV caching of published artifacts. Writes hit D1; reads prefer KV when status=published. All API routes: `{{ADMIN_HOSTNAME}}/api/*`.

## Astro Frontend
Uses `@astrojs/cloudflare`; build emits `dist/_worker.js`. All dynamic content fetches through `ADMIN_API`. Avoid hard-coding hostnames—reference env vars.

## Infrastructure (Terraform)
Apply before first deploy. Order: KV → D1 → R2 → DNS (implicitly handled by plan). Outputs consumed by CI for Wrangler variable substitution. Never manually paste live IDs into `wrangler.toml`—leave placeholders.

## Template Substitution
Only two mutation phases: generation (`setup.js`) + CI substitution. If adding new bindings, propagate placeholder pattern in: `project.config.json`, Terraform vars/outputs, both `wrangler.toml` files, and any docs referencing them.

## Conventions & Workflow
Deployment order: Infra → CMS (migrations) → Frontend. Never invert (frontend assumes API + bindings exist). Keep new docs & ADRs under `docs/` or an ADR directory—commit an ADR BEFORE a non-trivial code change (Documentation Policy). Avoid duplicating naming logic—import/extend instead.

Cost levers: prefer KV for read-hot published content; keep media in R2; avoid per-request dynamic DB queries for unchanged published pages.

## Troubleshooting Quick Table
| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| 500 on content fetch | Placeholder IDs not substituted | Ensure Terraform outputs exported to CI, redeploy |
| 404 API locally | CMS worker not running | Start `npm run dev` in `admin-sonicjs` |
| Stale content | KV not cleared post publish | Purge keys or implement publish hook invalidation |
| Wrong domain in responses | Regenerated domain not fully propagated | Re-run `setup.js`, commit regenerated files |
| Binding error deploy | Drifted manual edit in wrangler.toml | Restore placeholders & rerun pipeline |

## Safe Change Checklist
1. Add/update ADR (if architectural) before code.
2. Confirm change respects domain-derived naming (no hard-coded alt names).
3. Update both Workers if altering shared bindings or env expectations.
4. Regenerate via `setup.js` if domain/resource semantics change; commit diff.
5. Validate Terraform plan produces expected deltas only.
6. Deploy CMS first when schema/content changes.

Primary heuristic: If a change would require editing the same concept in more than one place manually, re-center around `project.config.json` and `setup.js` instead.

---
Operate assuming automation regenerates; minimize manual drift. When uncertain, inspect `setup.js` to see the canonical source of truth before editing downstream artifacts.