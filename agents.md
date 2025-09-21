# agents.md

## Project Overview

This is a **SonicJS Community Website Template** that provides automated infrastructure setup and documentation framework for creating community websites. The project uses a single-worker architecture where SonicJS (Astro-based CMS) includes both admin UI and public-facing content in one Cloudflare Workers deployment.

**Key Architecture:**

- Single integrated Astro application with admin at `/admin` routes
- Domain-based resource naming (all resources derive from `project.config.json`)
- Infrastructure as Code with Terraform
- Documentation-first workflow with ADRs

**Current Configuration:**

- Domain: `popfizz.win`
- Project: `popfizz`
- Database: `popfizz_db`
- Worker: Single SonicJS application

## Setup Commands

### Project Validation

```bash
# Comprehensive project validation
npm run validate
# or directly: node scripts/validate.js

# PowerShell version (Windows)
.\scripts\validate.ps1
```

### Initial Project Setup

```bash
# Generate configuration for any domain
node scripts/setup.js yourdomain.com "Your Community Description"
```

### Infrastructure Deployment

```bash
# Deploy Cloudflare resources first
cd infra
terraform init
terraform plan -var="account_id=$CF_ACCOUNT_ID" -var="zone_id=$CF_ZONE_ID"
terraform apply -var="account_id=$CF_ACCOUNT_ID" -var="zone_id=$CF_ZONE_ID"
```

### Application Deployment

```bash
# Deploy SonicJS application (after infrastructure)
cd app
npm install
npm run db:migrate
npm run deploy
```

### Local Development

```bash
# Start SonicJS development server
cd app
npm run dev
# Access: http://localhost:4321 (admin at /admin)
```

## Code Style & Conventions

### File Organization

- `app/` - SonicJS integrated application (main development area)
- `infra/` - Terraform infrastructure definitions
- `scripts/setup.js` - Single source for domain-based configuration generation
- `docs/` - Documentation with ADRs and development journal
- `project.config.json` - Authoritative configuration source

### Naming Conventions

- **Domain-driven naming**: All resource names derive from domain in `project.config.json`
- **Template placeholders**: Use `{{PLACEHOLDER}}` format for values substituted by CI
- **No manual drift**: Always regenerate via `scripts/setup.js`, never edit generated files directly

### Architecture Principles

1. **Documentation-first**: Create ADR before architectural changes
2. **Single worker**: Unified SonicJS app, not separate admin/frontend workers
3. **Template reusability**: Works for any domain via setup script
4. **Infrastructure symmetry**: Terraform and application configs stay synchronized

## Testing Instructions

### Validation Commands

```bash
# Validate project configuration
node scripts/setup.js --validate

# Check infrastructure plan
cd infra && terraform plan

# Test SonicJS build
cd app && npm run build

# Run database migrations locally
cd app && npm run db:migrate:local
```

### Common Debugging

```bash
# Check D1 database
wrangler d1 execute popfizz_db --command "SELECT * FROM posts;"

# View KV namespace
wrangler kv:key list --namespace-id 00233f0dc8f64cf48e48c49abc7a3b91

# Test R2 storage
wrangler r2 object list popfizz-media

# Check deployment status
wrangler deployments list
```

## Development Workflow

### Making Changes

1. **Read documentation first** - Check `docs/README.md` and relevant ADRs
2. **Document architectural changes** - Create ADR in `docs/adr/` if needed
3. **Regenerate if needed** - Run `scripts/setup.js` if domain/naming changes
4. **Test locally** - Use `npm run dev` in app directory
5. **Deploy infrastructure first** - Apply Terraform changes before app deployment
6. **Deploy application** - Run migrations then deploy SonicJS app

### File Editing Patterns

- **Never edit generated files directly** - Always go through `scripts/setup.js`
- **Maintain placeholder format** - Keep `{{PLACEHOLDER}}` tokens for CI substitution
- **Update both sides** - Infrastructure and application configs must stay in sync
- **Commit ADRs separately** - Documentation changes separate from implementation

### Directory Context

- Working in `app/` - SonicJS customization and development
- Working in `infra/` - Cloudflare resource provisioning
- Working in `scripts/` - Template generation and automation
- Working in `docs/` - Architecture documentation and decisions

## Environment Requirements

### Software Dependencies

- Node.js 20+
- npm (included with Node.js)
- Wrangler CLI: `npm install -g wrangler`
- Terraform 1.6+

### Cloudflare Prerequisites

- Account with domain zone configured
- API token with permissions: Workers, D1, R2, KV, DNS
- Account ID and Zone ID available

### Environment Variables

```bash
# Required for Terraform
export TF_VAR_cloudflare_api_token=your_token
export CF_ACCOUNT_ID=your_account_id
export CF_ZONE_ID=your_zone_id

# Optional for local development
export ADMIN_HOST=localhost:4321
export SITE_URL=http://localhost:4321
```

## Deployment Considerations

### Deployment Order (Critical)

1. **Infrastructure first** - Terraform must provision resources before app deployment
2. **Migrations** - Database schema must be applied before application deployment
3. **Application last** - SonicJS worker deployed after infrastructure exists

### Resource Dependencies

- D1 database must exist before running migrations
- KV namespace required for content caching
- R2 bucket needed for media uploads
- DNS records depend on worker deployment

### Common Pitfalls

- **Never deploy app before infrastructure** - Will fail with binding errors
- **Don't manually edit wrangler.toml** - Contains template placeholders for CI
- **Always run setup.js for domain changes** - Maintains naming consistency
- **Keep documentation updated** - ADRs must precede architectural changes

## Security Notes

### Secrets Management

- Cloudflare API tokens in GitHub Actions Secrets only
- No hardcoded credentials in repository
- Environment-specific configs in `.env.local` (gitignored)
- See `docs/adr/0003-secrets-handling.md` for full policy

### Access Patterns

- Admin UI at `/admin` routes requires authentication
- Public content served without authentication
- Content moderation through admin interface
- Least-privilege resource access

## Performance Considerations

### Caching Strategy

- Published content cached in KV for global edge reads
- Database writes go to D1, reads prefer KV when published
- Media assets served directly from R2 CDN
- Sub-100ms response times globally

### Cost Optimization

- Designed for Cloudflare free tier initially
- Pay-per-request scaling
- Efficient caching reduces database load
- R2 provides cost-effective media storage

## Troubleshooting

### Template Generation Issues

```bash
# Validate domain format
node scripts/setup.js --validate yourdomain.com

# Check generated configuration
cat project.config.json
```

### Infrastructure Problems

```bash
# Check Terraform state
cd infra && terraform show

# Validate configuration
terraform validate
```

### Application Deployment Failures

```bash
# Check binding configuration
wrangler dev --local

# Verify database connection
wrangler d1 info popfizz_db

# Test with local SQLite
npm run db:migrate:local
```

## Troubleshooting

### Automated Validation

```bash
# Run comprehensive validation
npm run validate

# Get detailed output
node scripts/validate.js --verbose

# PowerShell version
.\scripts\validate.ps1 -Verbose
```

### Common Issues

```bash
# Project configuration issues
node scripts/setup.js yourdomain.com "Description"  # Regenerate config

# Infrastructure validation
cd infra && terraform validate

# Application structure validation
npm run validate  # Identifies specific issues with fixes
```

### Quick Fixes

```bash
# Reset to clean state
node scripts/setup.js yourdomain.com "Your Description"
npm run validate
```

### Documentation Policy

- **Read first** - Check `docs/README.md` for current architecture
- **Validate often** - Run `npm run validate` before major changes  
- **Troubleshooting guide** - See `docs/TROUBLESHOOTING.md` for detailed solutions
- **ADR workflow** - Document decisions before implementation
- **Development journal** - Record learning and evolution in `docs/DEVELOPMENT-JOURNAL.md`
- **Living documentation** - Keep docs synchronized with code changes
