# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **production-ready template** for creating community-focused websites that scale globally with Cloudflare's edge network. The template is designed to be fully configurable for any domain and community type.

**Current Configuration:**
- Domain: `{{DOMAIN}}`
- Project Name: `{{PROJECT_NAME}}` 
- Database: `{{DATABASE_NAME}}`
- R2 Bucket: `{{R2_BUCKET_NAME}}`

> **Note:** This template uses a domain-based configuration system. All resource names are automatically derived from your domain in `project.config.json`.

## Configuration System

This template is designed to be reusable for any domain. The naming system automatically generates consistent resource names:

**Domain-Based Naming Convention:**
```
Domain: community.com
├─ Project Name: community
├─ Database: community_db  
├─ KV Namespace: COMMUNITY_PUBLISHED
├─ R2 Bucket: community-media
├─ Workers: community-web, community-admin
└─ Hostnames: community.com, admin.community.com
```

**Setup New Project:**
```bash
# Generate configuration and scaffold for your domain
node scripts/setup.js yourdomain.com "Your community description"
```

## Tech Stack

- **Frontend**: Astro v4+ with React components, SSR on Cloudflare Workers
- **Backend**: SonicJS (Workers-native headless CMS)
- **Infrastructure**: Cloudflare (Workers, KV, D1, R2, DNS)
- **IaC**: Terraform for resource provisioning
- **CI/CD**: GitHub Actions with automated deployments

## Repository Structure

```
sonicjs_project_template/
├── infra/                           # Terraform: Cloudflare resources
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── versions.tf
├── apps/
│   ├── web-astro/                   # Frontend site (SSR on Workers)
│   │   ├── package.json
│   │   ├── astro.config.mjs
│   │   ├── wrangler.toml
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       └── layouts/
│   └── admin-sonicjs/               # SonicJS CMS Worker
│       ├── package.json
│       ├── wrangler.toml
│       ├── sonic.config.mjs         # Collections & roles config
│       ├── src/index.ts
│       └── migrations/              # D1 SQL migrations
├── scripts/
│   └── setup.js                    # Main project configuration script
└── docs/                           # Documentation & ADRs
```

## Prerequisites

**Required Software:**
- Node.js 20+
- npm (included with Node.js)
- Wrangler CLI: `npm install -g wrangler`
- Terraform 1.6+

**Cloudflare Account Requirements:**
- Cloudflare account with your domain zone added
- API token with permissions for:
  - Account: Workers, D1, R2, KV
  - Zone: DNS for your domain

**Environment Variables:**
```bash
# For Terraform
export TF_VAR_cloudflare_api_token=your_api_token_here
export CF_ACCOUNT_ID=your_account_id
export CF_ZONE_ID=your_zone_id
```

## Quick Start

### 1. Configure Your Project
```bash
# Run setup script with your domain
node scripts/setup.js yourdomain.com "Your Community Description"
```

### 2. Update Cloudflare Configuration
Edit `project.config.json` and replace placeholder values:
```json
{
  "cloudflare": {
    "account_id": "your-actual-account-id",
    "zone_id": "your-actual-zone-id"
  }
}
```

### 3. Deploy Infrastructure
```bash
cd infra
terraform init
terraform plan -var="account_id=$CF_ACCOUNT_ID" -var="zone_id=$CF_ZONE_ID"
terraform apply -var="account_id=$CF_ACCOUNT_ID" -var="zone_id=$CF_ZONE_ID"
```

### 4. Set Up Applications

**SonicJS CMS (Backend):**
```bash
cd apps/admin-sonicjs
npm install
wrangler d1 migrations apply {{DATABASE_NAME}}
npm run dev
# Accessible at http://localhost:8787
# Admin UI at http://localhost:8787/admin
```

**Astro Frontend:**
```bash
cd apps/web-astro
npm install
npm run build
npm run dev
# Accessible at http://localhost:8788
```

## Development Commands

### Common Development Tasks

**View D1 Database:**
```bash
wrangler d1 execute {{DATABASE_NAME}} --command "SELECT * FROM posts;"
```

**Upload to R2 Storage:**
```bash
wrangler r2 object put {{R2_BUCKET_NAME}}/image.jpg --file ./image.jpg
```

**Clear KV Cache:**
```bash
wrangler kv:bulk delete --namespace-id YOUR_KV_ID --force
```

## Building & Deployment

### Manual Deployment

**Deploy SonicJS CMS:**
```bash
cd apps/admin-sonicjs
npm run deploy
```

**Deploy Astro Frontend:**
```bash
cd apps/web-astro
npm run build
npm run deploy
```

### Automated CI/CD

Push to `main` branch triggers automatic deployment:
1. Terraform applies infrastructure changes
2. SonicJS CMS deploys to `{{ADMIN_HOSTNAME}}`
3. Astro frontend deploys to `{{ROOT_HOSTNAME}}`

**Required GitHub Secrets:**
- `CLOUDFLARE_API_TOKEN`
- `CF_ACCOUNT_ID` 
- `CF_ZONE_ID`

## Architecture & Data Flow

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browser   │───▶│  Astro Frontend  │───▶│  SonicJS API    │
│             │    │  (Worker SSR)    │    │  (Worker CMS)   │
└─────────────┘    └──────────────────┘    └─────────────────┘
                            │                        │
                            ▼                        ▼
                   ┌─────────────────┐      ┌─────────────────┐
                   │   KV (Cache)    │      │   D1 Database   │
                   │   R2 (Media)    │      │   (Content)     │
                   └─────────────────┘      └─────────────────┘
```

**Request Flow:**
1. Client requests page from `{{ROOT_HOSTNAME}}`
2. Astro Worker renders SSR page
3. API calls to `{{ADMIN_HOSTNAME}}/api/*` for content
4. SonicJS serves from D1 database or KV cache
5. Media assets served directly from R2 bucket
6. Rendered HTML returned to client

**Key Collections:**
- `posts`: Blog articles and community content
- `submissions`: User-submitted content awaiting moderation
- `authors`: CMS users with different permission levels

## Content Management

**Roles:**
- **Admin**: Full access to all content and settings
- **Editor**: Can edit and publish any posts
- **Author**: Can create and edit own posts only

**Publishing Workflow:**
1. Author creates post with status `draft`
2. Editor reviews and changes status to `review`
3. Admin/Editor publishes (status becomes `published`)
4. Published content cached in KV for fast reads

## Customization

### Content Types
Modify `apps/admin-sonicjs/sonic.config.mjs` to add custom content types:

```javascript
collections: {
  posts: {
    fields: {
      title: { type: "string", required: true },
      content: { type: "richtext" },
      category: { type: "enum", values: ["tutorial", "showcase", "news"] }
    }
  }
}
```

### Frontend Styling
Customize appearance by editing:
- `apps/web-astro/src/styles/` - Global styles
- `apps/web-astro/src/components/` - Component styles

### Domain Configuration
Change domains anytime:
```bash
node scripts/setup.js newdomain.com "New description"
```

## Troubleshooting

**Common Issues:**

*Setup script fails with validation errors:*
- Ensure domain format is correct (e.g., "example.com", not "Example.Com")
- Domain must start with alphanumeric characters

*Wrangler deployment fails with binding errors:*
- Ensure Terraform has been applied and outputs are available
- Check that `project.config.json` has correct Cloudflare IDs

*Local development can't connect to D1:*
```bash
# Ensure you're authenticated
wrangler auth login

# Check D1 database exists
wrangler d1 list

# Re-run migrations if needed
wrangler d1 migrations apply {{DATABASE_NAME}} --local
```

*404 errors on frontend routes:*
- Check Astro routing in `src/pages/`
- Verify API endpoints are accessible at `{{ADMIN_HOSTNAME}}/api/`

*KV cache stale content:*
```bash
# Clear cache manually
wrangler kv:bulk delete --namespace-id YOUR_KV_ID
```

## Performance Considerations

- **Cold starts**: Both Workers have minimal cold start overhead
- **Caching**: KV stores published content for sub-100ms reads globally  
- **Images**: R2 provides global CDN distribution for media assets
- **Database**: D1 regional replicas reduce latency for writes

## Security Notes

- API endpoints protected by SonicJS authentication
- Content moderation through admin interface
- All resources deployed with least-privilege access patterns
- Environment variables for sensitive configuration

## Testing Strategy

**Development Testing:**
```bash
# Test CMS functionality
cd apps/admin-sonicjs && npm test

# Test frontend build
cd apps/web-astro && npm run build

# Integration testing with local Workers
npm run test:integration
```

## Cost Optimization

This template is designed for cost efficiency:

**Cloudflare Free Tier Limits:**
- D1: 25M reads, 100K writes/month
- Workers: 100K requests/day
- KV: 10M reads, 1M writes/month
- R2: 10GB storage, 1M Class A operations/month

**Typical Monthly Costs:**
- Small communities (< 1K visitors): $0-5
- Medium communities (10K+ visitors): $10-25
- Large communities (100K+ visitors): $25-100

## Development Environment Setup

Create `.env.local` files in each app directory:

**apps/admin-sonicjs/.env.local:**
```
ADMIN_HOST=localhost:8787
CORS_ORIGIN=http://localhost:8788
PROJECT_NAME={{PROJECT_NAME}}
```

**apps/web-astro/.env.local:**
```
ADMIN_API=http://localhost:8787/api
SITE_URL=http://localhost:8788
PROJECT_NAME={{PROJECT_NAME}}
```

## Contributing

This template is open source. See:
- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Architecture Documentation](docs/README.md)