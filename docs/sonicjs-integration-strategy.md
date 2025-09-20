# SonicJS Integration Strategy

## Overview

This document outlines how to integrate SonicJS's manual setup process with our automated domain-based infrastructure provisioning system.

## Current SonicJS Workflow

1. `git clone https://github.com/lane711/sonicjs.git`
2. `cd sonicjs && npm install`
3. `cp wrangler.example.toml wrangler.toml`
4. `npx wrangler d1 create sonicjs` (manual resource creation)
5. `npx wrangler kv namespace create sonicjs` (manual resource creation)
6. Edit `wrangler.toml` with IDs from step 4-5 (manual configuration)
7. `npm run up` (database setup)
8. `npm run dev` (local development)

## Proposed Automated Integration

### 1. Enhanced Setup Script

Extend `scripts/setup.js` to:

```javascript
// New SonicJS integration functions
async function integrateSonicJS(config) {
  // Clone or copy SonicJS source to app/ directory
  await cloneSonicJSTemplate(config);
  
  // Generate wrangler.toml with placeholders
  await generateSonicJSWranglerConfig(config);
  
  // Generate custom.config.ts with domain-specific schemas
  await generateCustomConfig(config);
  
  // Generate package.json with domain-specific naming
  await generatePackageJson(config);
}
```

### 2. SonicJS Template Integration

**Directory Structure:**

```text
sonicjs-community-template/
├── app/                      # SonicJS application (replaces apps/)
│   ├── src/                  # SonicJS source with customizations
│   │   ├── custom/
│   │   │   ├── custom.config.ts      # Generated from template
│   │   │   └── db/schema/            # Community-specific schemas
│   │   ├── pages/
│   │   │   ├── admin/                # SonicJS admin UI
│   │   │   └── index.astro           # Public homepage
│   │   └── ...                       # Rest of SonicJS structure
│   ├── wrangler.toml         # Generated with placeholders
│   ├── package.json          # Template-customized
│   └── astro.config.mjs      # SonicJS configuration
├── infra/                    # Terraform (targeting single worker)
├── scripts/
│   ├── setup.js              # Enhanced with SonicJS integration
│   └── sync-sonicjs.js       # Future: upstream sync utility
└── docs/
    └── customization.md      # SonicJS customization guide
```

### 3. Resource Naming Alignment

**Mapping SonicJS bindings to our domain-based naming:**

| SonicJS Binding | Our Resource Name | Terraform Resource |
|-----------------|-------------------|-------------------|
| `D1` | `${project}_db` | `cloudflare_d1_database.main` |
| `KV` | `${PROJECT}_PUBLISHED` | `cloudflare_workers_kv_namespace.published` |
| `R2` | `${project}-media` | `cloudflare_r2_bucket.media` |

### 4. Generated wrangler.toml Template

```toml
name = "{{WORKER_NAME}}"
compatibility_date = "2024-07-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "{{WORKER_NAME}}"

[[env.production.d1_databases]]
binding = "D1"
database_name = "{{DATABASE_NAME}}"
database_id = "{{D1_DATABASE_ID}}"

[[env.production.kv_namespaces]]
binding = "KV"
id = "{{KV_NAMESPACE_ID}}"
preview_id = "{{KV_NAMESPACE_ID}}"

[[env.production.r2_buckets]]
binding = "R2"
bucket_name = "{{R2_BUCKET_NAME}}"

[env.production.vars]
SITE_URL = "https://{{ROOT_HOSTNAME}}"
ADMIN_URL = "https://{{ROOT_HOSTNAME}}/admin"
PROJECT_NAME = "{{PROJECT_NAME}}"
# ... other SonicJS environment variables
```

### 5. Automated Setup Flow

**New Enhanced Process:**

```bash
# 1. Generate project from template
node scripts/setup.js yourdomain.com "Community Description"

# 2. Provision infrastructure (creates all resources)
cd infra && terraform apply

# 3. Deploy application (automated wrangler setup)
cd ../app
npm install
npm run db:setup      # Set up database schema
npm run deploy         # Deploy with substituted IDs

# 4. Local development
npm run dev            # Uses local SQLite for development
```

### 6. Template Customizations

**Community-Specific Schema Extensions:**

```typescript
// app/src/custom/db/schema/community-posts.ts
export const definition = {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  category: text("category"),
  featuredImage: text("featuredImage"),
  // Community-specific fields
  eventDate: integer("eventDate"),
  location: text("location"),
  organizerId: text("organizerId"),
};

export const access: ApiConfig["access"] = {
  operation: {
    read: true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
};
```

**Template-Specific Configuration:**

```typescript
// app/src/custom/custom.config.ts (generated)
export const tableSchemas = {
  ...coreSonicJSSchemas,
  // Template additions
  communityPosts: require('./db/schema/community-posts'),
  events: require('./db/schema/events'),
  members: require('./db/schema/members'),
  // Domain-specific customizations
};
```

### 7. Development Workflow

**Local Development:**

```bash
cd app
npm run dev              # Starts SonicJS on localhost:4321
# Admin UI: http://localhost:4321/admin
# Public site: http://localhost:4321
```

**Deployment:**

```bash
npm run build           # Build for production
npm run deploy          # Deploy to Cloudflare Workers
```

### 9. Upgrade Path

**Maintaining SonicJS Updates:**

```bash
# Future utility for syncing with upstream SonicJS
node scripts/sync-sonicjs.js
# - Fetches latest SonicJS release
# - Applies updates while preserving customizations
# - Runs tests to ensure compatibility
```

## Implementation Priority

1. **Phase 1: Core Integration** (Immediate)
   - Update `scripts/setup.js` with SonicJS integration
   - Create `app/` directory structure with SonicJS
   - Modify Terraform to target single worker
   - Test end-to-end setup flow

2. **Phase 2: Template Features** (Near-term)
   - Add community-specific schemas
   - Implement domain-based branding
   - Create customization documentation
   - Enhance template automation

3. **Phase 3: Advanced Features** (Future)
   - Upstream sync utility
   - Multiple template variants
   - CI/CD integration improvements
   - Performance optimizations

## Success Criteria

- ✅ Single command setup: `node scripts/setup.js domain.com "Description"`
- ✅ Automated resource provisioning without manual ID copying
- ✅ Functional SonicJS admin UI with domain-specific branding
- ✅ Community-focused content schemas out of the box
- ✅ Clear upgrade path for SonicJS improvements
- ✅ Simplified local development workflow

This integration preserves SonicJS's proven architecture while adding our automation and template benefits.
