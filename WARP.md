# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **SonicJS community template** that provides automated infrastructure setup and documentation framework for the SonicJS headless CMS. SonicJS is designed as a single integrated Astro application that includes both admin UI and public-facing content in one deployment.

**Current Configuration:**
- Domain: `{{DOMAIN}}`
- Project Name: `{{PROJECT_NAME}}` 
- Database: `{{DATABASE_NAME}}`
- R2 Bucket: `{{R2_BUCKET_NAME}}`

> **Note:** This template integrates SonicJS with a domain-based configuration system. All resource names are automatically derived from your domain in `project.config.json`.

## Architecture Overview

**SonicJS Integration:**
- **Single Worker Deployment**: Unified Astro application with admin UI at `/admin` routes
- **Automated Setup**: Eliminates manual resource creation and configuration editing
- **Community Templates**: Pre-configured schemas for community websites
- **Infrastructure as Code**: Terraform handles all Cloudflare resource provisioning

**Key Differences from Standard SonicJS:**
- Automated resource provisioning (no manual `wrangler d1 create` steps)
- Domain-based naming conventions for all resources
- Template-specific content schemas and customizations
- Integrated documentation and deployment workflows

## Configuration System

This template is designed to be reusable for any domain. The naming system automatically generates consistent resource names:

**Domain-Based Naming Convention:**
```
Domain: community.com
├─ Project Name: community
├─ Database: community_db  
├─ KV Namespace: COMMUNITY_PUBLISHED
├─ R2 Bucket: community-media
├─ Worker: community-sonicjs (single application)
└─ Hostname: community.com (admin at /admin)
```

**Setup New Project:**
```bash
# Generate configuration and scaffold for your domain
node scripts/setup.js yourdomain.com "Your community description"
```

## Tech Stack

- **Frontend & Backend**: SonicJS (Astro v4+ with React components, SSR on Cloudflare Workers)
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Cache**: Cloudflare KV for published content caching
- **Media Storage**: Cloudflare R2 for file uploads
- **Infrastructure**: Terraform for automated resource provisioning
- **CI/CD**: GitHub Actions with automated deployments

## Repository Structure

```text
{{PROJECT_NAME}}/
├── app/                           # SonicJS integrated application
│   ├── src/
│   │   ├── custom/               # Community-specific schemas
│   │   ├── pages/
│   │   │   ├── admin/            # SonicJS admin UI
│   │   │   └── index.astro       # Public homepage
│   │   └── ...                   # Full SonicJS structure
│   ├── wrangler.toml             # Generated with placeholders
│   └── package.json              # SonicJS dependencies
├── infra/                        # Terraform: Cloudflare resources
│   ├── main.tf                   # Resource definitions
│   ├── outputs.tf                # Resource IDs for deployment
│   └── variables.tf              # Configuration variables
├── scripts/
│   ├── setup.js                  # Enhanced with SonicJS integration
│   └── sync-sonicjs.js           # Future: upstream sync utility
└── docs/
    ├── adr/                      # Architecture Decision Records
    ├── sonicjs-integration-strategy.md
    └── customization.md          # SonicJS customization guide
```

## Prerequisites

**Required Software:**
- Node.js 20+
- npm (included with Node.js)
- Wrangler CLI: `npm install -g wrangler`
- Terraform 1.6+

**Cloudflare Account Requirements:**
- Cloudflare account with `{{DOMAIN}}` zone added
- API token with permissions for:
  - Account: Workers, D1, R2, KV
  - Zone: DNS for `{{DOMAIN}}`

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

### 4. Deploy SonicJS Application

```bash
cd app
npm install
npm run db:migrate     # Run migrations against provisioned DB
npm run deploy         # Deploy to Cloudflare Workers
```

### 5. Access Your Site

- **Public Site**: `https://{{ROOT_HOSTNAME}}`
- **Admin UI**: `https://{{ROOT_HOSTNAME}}/admin`

## Development Commands

### Local Development

```bash
cd app
npm run dev              # Starts SonicJS on localhost:4321
# Public site: http://localhost:4321
# Admin UI: http://localhost:4321/admin
```

### Common Development Tasks

```bash
# View D1 Database
wrangler d1 execute {{DATABASE_NAME}} --command "SELECT * FROM posts;"

# Upload to R2 Storage
wrangler r2 object put {{R2_BUCKET_NAME}}/image.jpg --file ./image.jpg

# Clear KV Cache
wrangler kv:bulk delete --namespace-id YOUR_KV_ID --force
```

## Building & Deployment

### Manual Deployment

```bash
cd app
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

```text
┌─────────────┐    ┌──────────────────────────┐    ┌─────────────────┐
│   Browser   │───▶│     SonicJS Worker       │───▶│   D1 Database   │
│             │    │  (Admin UI + Frontend)   │    │   (Content)     │
└─────────────┘    └──────────────────────────┘    └─────────────────┘
                            │                              │
                            ▼                              ▼
                   ┌─────────────────┐            ┌─────────────────┐
                   │   KV (Cache)    │            │   R2 (Media)    │
                   │                 │            │                 │
                   └─────────────────┘            └─────────────────┘
```

**Request Flow:**

1. Client requests page from `{{ROOT_HOSTNAME}}`
2. SonicJS Worker serves admin UI (at `/admin`) or public pages
3. Content fetched from D1 database or KV cache
4. Media assets served directly from R2 bucket
5. Rendered HTML returned to client

**Key Collections:**

- `posts`: Blog articles and community content
- `submissions`: User-submitted content awaiting moderation
- `users`: Admin users with different permission levels

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

Modify `app/src/custom/custom.config.ts` to add custom content types and schemas.

### Frontend Styling

Customize appearance by editing SonicJS pages and components in:

- `app/src/pages/` - Page routes and layouts
- `app/src/components/` - Reusable components

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

*404 errors on SonicJS pages:*

- Check SonicJS routing in `app/src/pages/`
- Verify admin routes are accessible at `/admin`

*KV cache stale content:*

```bash
# Clear cache manually
wrangler kv:bulk delete --namespace-id YOUR_KV_ID
```

## Performance Considerations

- **Cold starts**: SonicJS Worker has minimal cold start overhead
- **Caching**: KV stores published content for sub-100ms reads globally  
- **Images**: R2 provides global CDN distribution for media assets
- **Database**: D1 regional replicas reduce latency for writes

## Security Notes

- Admin interface protected by SonicJS authentication
- Content moderation through admin interface
- All resources deployed with least-privilege access patterns
- Environment variables for sensitive configuration

## Testing Strategy

**Development Testing:**

```bash
# Test SonicJS functionality
cd app && npm test

# Test production build
cd app && npm run build

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

Create `.env.local` file in the app directory:

**app/.env.local:**

```env
ADMIN_HOST=localhost:8787
SITE_URL=http://localhost:8787
PROJECT_NAME={{PROJECT_NAME}}
```

## Contributing

This template is open source. See:

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Architecture Documentation](docs/README.md)
