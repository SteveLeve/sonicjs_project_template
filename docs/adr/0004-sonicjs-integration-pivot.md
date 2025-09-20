# ADR 0002: SonicJS Integration Architecture Pivot

Date: 2025-09-19
Status: Accepted
Context Version: 1.0

## Status

Accepted

## Context

Initial project conception created a dual-worker architecture with separate CMS and frontend applications (`apps/admin-sonicjs/` and `apps/web-astro/`). However, after examining the official SonicJS repository at <https://github.com/lane711/sonicjs>, it's clear that SonicJS is designed as a single integrated application that includes:

1. **Unified Architecture**: SonicJS combines the admin UI, API endpoints, and frontend in a single Astro application
2. **Built-in Admin UI**: The admin interface is served from the same worker at `/admin` routes
3. **Integrated Build Process**: Uses Astro with Cloudflare adapter for both admin and public facing pages
4. **Single Worker Deployment**: One `wrangler.toml`, one deployment target

**SonicJS Installation Flow (Current Manual Process):**

```bash
git clone https://github.com/lane711/sonicjs.git
cd sonicjs
npm install
cp wrangler.example.toml wrangler.toml
npx wrangler d1 create sonicjs
# Edit wrangler.toml with database ID
npm run up      # Apply schema
npm run dev     # Local development
```

**Our Current Architecture (Misaligned):**

- Separate CMS and frontend workers
- Complex inter-worker communication
- Duplicated infrastructure bindings
- Overcomplicated deployment process

## Problem Statement

Our current template architecture fundamentally misunderstands SonicJS's design philosophy. We've created unnecessary complexity by splitting what should be a single application into two separate workers. This creates:

1. **Maintenance Overhead**: Two separate deployments, configurations, and potential points of failure
2. **Performance Penalty**: Inter-worker API calls instead of direct database access
3. **Security Complexity**: Cross-origin requests between workers require CORS configuration
4. **Developer Friction**: More complex local development setup
5. **Architectural Drift**: Moving away from SonicJS's battle-tested patterns

## Forces / Requirements

- **Alignment with SonicJS**: Preserve the proven architecture and developer experience
- **Automation Goals**: Maintain our domain-based configuration and infrastructure automation
- **Template Reusability**: Enable easy setup for multiple domains/projects
- **Documentation-First**: Capture this pivot before implementing changes
- **Migration Path**: Provide clear steps to transition existing installations

## Decision

**Pivot to SonicJS-aligned single-worker architecture:**

1. **Single Application Structure**: Replace `apps/admin-sonicjs/` and `apps/web-astro/` with a single `app/` directory that forks SonicJS
2. **Integrated SonicJS Fork**: Create a template-friendly fork of SonicJS that integrates with our domain-based configuration system
3. **Automated Configuration Injection**: Extend `scripts/setup.js` to:
   - Clone/copy SonicJS codebase
   - Generate `wrangler.toml` with our placeholder system
   - Inject domain-specific branding and configuration
   - Maintain upgrade path to upstream SonicJS releases
4. **Preserve Infrastructure Automation**: Keep Terraform provisioning but target single worker deployment
5. **Enhanced Setup Script**: Integrate SonicJS installation steps into our automated process

## New Architecture

```text
sonicjs-community-template/
├── infra/                    # Terraform (unchanged)
├── app/                      # Single SonicJS application
│   ├── src/                  # SonicJS source with customizations
│   ├── wrangler.toml         # Generated with placeholders
│   ├── package.json          # SonicJS dependencies + customizations
│   └── sonic.config.mjs      # Template-specific collections/schemas
├── scripts/
│   ├── setup.js              # Enhanced with SonicJS integration
│   └── sync-sonicjs.js       # Future: sync with upstream
└── docs/
    └── customization.md      # Guide for extending the template
```

## Implementation Strategy

### Phase 1: Architecture Transition

1. Create new `app/` directory structure
2. Integrate SonicJS codebase as template foundation
3. Update `scripts/setup.js` to handle SonicJS configuration
4. Modify Terraform to target single worker deployment

### Phase 2: Enhanced Automation

1. Automate the SonicJS manual setup steps:
   - Generate `wrangler.toml` from `project.config.json`
   - Run database creation and schema migration
   - Configure bindings automatically
2. Integrate domain-specific customizations
3. Add template-specific collections and schemas

### Phase 3: Template Features

1. Add community-focused SonicJS collections (posts, events, members)
2. Create template-specific admin UI customizations
3. Implement domain-based branding system
4. Add upgrade mechanism for SonicJS updates

## Integration with Existing Setup Process

**Enhanced Setup Flow:**

```bash
# 1. Domain-based project generation (existing)
node scripts/setup.js yourdomain.com "Community Description"

# 2. Infrastructure provisioning (existing)  
cd infra && terraform apply

# 3. Application setup (new - automates SonicJS flow)
cd app && npm install
npm run db:create    # Automated wrangler d1 create
npm run db:migrate   # Automated schema application
npm run deploy       # Deploy to Cloudflare

# 4. Local development
npm run dev          # Single command for integrated development
```

## Resource Naming Alignment

Maintain our domain-based naming but align with SonicJS conventions:

```json
{
  "resources": {
    "database": "community_db",           // SonicJS expects database binding "D1"
    "kv_namespace": "COMMUNITY_PUBLISHED", // For published content caching
    "r2_bucket": "community-media",       // For file uploads
    "worker": "community-sonicjs",        // Single worker name
    "hostname": "community.com"           // Admin at /admin route
  }
}
```

## Migration Path for Existing Installations

1. **Deprecation Notice**: Mark dual-worker approach as deprecated
2. **Migration Script**: Provide script to:
   - Export content from existing CMS worker
   - Provision new single-worker architecture
   - Import content to new structure
   - Update DNS configuration
3. **Documentation**: Clear migration guide with rollback instructions

## Security Considerations

- **Simplified Attack Surface**: Single worker reduces complexity
- **Integrated Authentication**: Leverage SonicJS's built-in auth patterns
- **Resource Access**: Direct database access eliminates inter-worker API exposure
- **CORS Elimination**: No cross-origin requests between workers needed

## Alternatives Considered

1. **Maintain Dual-Worker**: Rejected due to complexity and drift from SonicJS patterns
2. **Heavy SonicJS Modification**: Rejected as it would break upgrade path
3. **Wrapper Approach**: Rejected as it adds unnecessary abstraction layer
4. **Full Custom CMS**: Rejected as SonicJS provides proven foundation

## Consequences

**Positive:**

- Aligned with battle-tested SonicJS architecture
- Simplified deployment and maintenance
- Better performance (direct DB access)
- Easier local development
- Clear upgrade path for SonicJS improvements
- Reduced security surface area

**Negative:**

- Requires significant refactoring of current structure
- Need to understand SonicJS customization patterns
- Potential breaking changes for any existing installations
- Dependency on SonicJS release cycle

**Neutral:**

- Different customization approach (SonicJS patterns vs. separate apps)
- Learning curve for SonicJS-specific development patterns

## Success Metrics

1. **Setup Time**: Reduce from manual multi-step process to single automated command
2. **Performance**: Eliminate inter-worker latency for content fetching
3. **Maintainability**: Single codebase, single deployment target
4. **Upgrade Path**: Ability to incorporate upstream SonicJS improvements
5. **Developer Experience**: Simplified local development workflow

## Follow-Up Actions

1. **Create new branch** for architecture transition
2. **Archive current apps/** directories with deprecation notice
3. **Implement Phase 1** of transition strategy
4. **Update all documentation** to reflect new architecture
5. **Create migration guide** for any existing installations
6. **Add SonicJS customization documentation**

## References

- SonicJS Repository: <https://github.com/lane711/sonicjs>
- SonicJS Documentation: <https://sonicjs.com>
- ADR 0001: Secrets and Configuration Handling
- Documentation Policy: /docs/README.md

---

This ADR supersedes the dual-worker architecture assumptions and aligns the project with SonicJS's proven single-application design pattern.