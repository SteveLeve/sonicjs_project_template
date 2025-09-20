# ADR 0001: Secrets and Configuration Handling

Date: 2025-09-19
Status: Accepted
Context Version: 1.0

## Status

Accepted

## Context

The project provisions Cloudflare resources (Workers, D1, KV, R2, DNS) via Terraform and deploys two Workers (CMS + Frontend) via Wrangler. Resource names are deterministically derived from `project.config.json` by `scripts/setup.js` and contain placeholder tokens (`{{D1_DATABASE_ID}}`, `{{KV_NAMESPACE_ID}}`, etc.) that are later substituted by CI/CD. We must prevent leakage of:

- Cloudflare API tokens
- Future auth/session secrets (if added)
- Any credentials granting write access to infrastructure or data

Simultaneously, we want reproducible, drift-free infra. Identifiers (e.g., D1 DB ID, KV namespace ID) are not high‑risk secrets but can still reveal architecture. They should be handled as configuration, not source code constants inside application logic.

## Forces / Requirements

- Documentation-first workflow: decisions must precede implementation.
- Deterministic regeneration: `setup.js` is sole naming source; no manual edits to Wrangler or Terraform for IDs.
- Separation of concerns: secret values (tokens) vs. public/derivable IDs (database name) vs. runtime binding IDs (database_id) produced after Terraform apply.
- CI must perform placeholder substitution without reintroducing manual drift.
- Least privilege: API token should have only required scopes.
- Ease of rotation: Single source update, automated redeploy.

## Decision

1. Keep only placeholders for Cloudflare binding IDs inside all committed `wrangler.toml` files. Never commit real IDs.
2. Store sensitive tokens exclusively in GitHub Actions Secrets. Use Variables (non-secret) for non-sensitive IDs.
3. After `terraform apply`, capture outputs and map them to GitHub Actions Variables (not Secrets) unless policy hardens them.
4. CI job performs an ephemeral, in-workspace substitution of placeholders before `wrangler deploy`. Modified files are NOT committed back.
5. Local development uses `.env.local` (gitignored) for any future secrets and environment-specific overrides.
6. Rotation requires no code change: update Secret/Variable in GitHub, optionally re-run Terraform (if resource recreated), then redeploy.
7. Add a CI guard step failing the build if placeholders persist post-substitution (ensures substitution ran) OR if an accidental commit of real IDs is detected (regex check comparing against Terraform outputs fetched at runtime isn't feasible without re-applying; instead guard ensures placeholders remain in repo state, not in deployed artifact copy).
8. Maintain a clear classification table in this ADR for future secret additions.

## Classification Table

| Item | Type | Storage | Rationale |
|------|------|---------|-----------|
| Cloudflare API Token | Secret | GitHub Actions Secret `CLOUDFLARE_API_TOKEN` | Grants infra + deploy permissions |
| Account ID | Config (quasi-public) | GitHub Actions Variable `CF_ACCOUNT_ID` | Needed by Terraform & Wrangler context |
| Zone ID | Config | GitHub Actions Variable `CF_ZONE_ID` | Required for DNS operations |
| D1 Database ID | Config (post-provision) | Variable `D1_DATABASE_ID` | Needed for Wrangler binding substitution |
| KV Namespace ID | Config (post-provision) | Variable `KV_NAMESPACE_ID` | Needed for Wrangler binding substitution |
| R2 Bucket Name | Config | Variable `R2_BUCKET` | Public resource name |
| Future Auth Secrets (e.g., JWT signing) | Secret | Actions Secret (e.g., `JWT_SECRET`) | Security-critical |

## Implementation Outline

1. Terraform apply outputs: capture manually or via a Terraform output step in CI (if automated later) and populate repo-level Variables.
2. CI Workflow Steps (abstract):
   - Checkout
   - (Optional) Terraform apply (in infra workflow)
   - Export Variables into substitution script
   - Replace placeholders in a temp copy (working directory state before deploy, not committed)
   - Deploy CMS, then Frontend
   - Run guard: ensure repo `wrangler.toml` still contains placeholders (unmodified in Git history)
3. Add regex guard script (future): fails if `wrangler.toml` contains an obvious Cloudflare ID pattern outside placeholder constructs.

## Security Considerations

- Cloudflare tokens limited to required scopes: (Workers R/W, D1 R/W, KV R/W, R2 R/W, DNS edit) — consider splitting into deploy vs. infra tokens later.
- Avoid echoing secrets in logs. Use `sed` substitutions directly; never cat substituted file contents to logs.
- Rotation cadence documented (quarterly or as-needed on suspicion).

## Alternatives Considered

- Committing substituted IDs: Rejected; introduces drift and manual edits contrary to regeneration model.
- Using only Secrets (no Variables): Adds friction & obfuscates non-sensitive values; unnecessary secrecy.
- Storing IDs in `project.config.json`: Increases chance of merge conflicts & accidental manual edits; prefer single Terraform output → CI variable mapping.

## Consequences

Positive:

- Clear separation between deterministic generation and runtime binding IDs.
- Simplified rotation and audit.
- Prevents accidental leakage through commits.

Negative:

- Requires CI logic to maintain substitution script.
- Slight overhead when adding new bindings (must extend placeholder + variable + substitution).

## Follow-Up Actions

- Add GitHub Actions workflow with substitution + guard.
- Add guard script (shell/Node) to validate placeholder presence in repo version of files.
- Add ADR reference link to `README.md` and `WARP.md`.
- If future multi-env (staging/prod), replicate Variables/Secrets per Environment.

## References

- Documentation policy (/docs/README.md)
- Setup script `scripts/setup.js` (naming authority)

---

This ADR may be superseded if we introduce environment matrix deployments or secret manager integration (e.g., Cloudflare Workers Secrets API).
