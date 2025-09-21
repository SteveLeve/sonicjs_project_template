# Troubleshooting Guide

## Quick Validation

Before deploying or when encountering issues, run the automated validation scripts:

### Node.js Version (Comprehensive)
```bash
node scripts/validate.js
```

### PowerShell Version (Windows)
```powershell
.\scripts\validate.ps1
```

### Verbose Output
```powershell
.\scripts\validate.ps1 -Verbose
```

## Common Issues & Solutions

### Project Configuration Issues

**Error: Invalid domain format**
```bash
# Fix: Use lowercase domain format
node scripts/setup.js example.com "My Community"
```

**Error: Resource naming mismatch**
```bash
# Regenerate configuration from domain
node scripts/setup.js yourdomain.com "Your Description"
```

### Infrastructure Issues

**Error: Terraform validation failed**
```bash
# Check specific errors
cd infra && terraform validate

# Common fix: DNS record type
# Change cloudflare_record to cloudflare_dns_record in main.tf
```

**Error: Environment variables not set**
```bash
# Set required variables
export TF_VAR_cloudflare_api_token="your_token"
export CF_ACCOUNT_ID="your_account_id"  
export CF_ZONE_ID="your_zone_id"
```

### Application Structure Issues

**Error: Old apps/ directory found**
```bash
# Remove dual-worker structure
rm -rf apps/
# Use single app/ directory instead
```

**Error: Missing wrangler.toml placeholders**
- Ensure wrangler.toml contains `{{D1_DATABASE_ID}}` and `{{KV_NAMESPACE_ID}}`
- Never commit real IDs - use placeholders for CI substitution

### Deploy Pipeline Issues

**Error: Deploy workflow references dual-worker**
- Update `.github/workflows/deploy.yml`
- Change `apps/admin-sonicjs` and `apps/web-astro` to `app`
- Use single worker deployment pattern

**Error: Missing placeholder substitution**
- Ensure deploy.yml includes sed commands to replace placeholders
- Verify guard steps check for placeholder presence

## Architecture Validation Checklist

### ✅ Single Worker Architecture
- [ ] Single `app/` directory (not `apps/`)
- [ ] One `wrangler.toml` with all bindings
- [ ] Admin UI at `/admin` routes (not separate subdomain)
- [ ] Deploy workflow targets single worker

### ✅ Domain-Based Naming
- [ ] All resource names derive from domain in `project.config.json`
- [ ] Project name = domain prefix
- [ ] Database name = `{project}_db`
- [ ] KV namespace = `{PROJECT}_PUBLISHED`
- [ ] R2 bucket = `{project}-media`

### ✅ Placeholder System
- [ ] wrangler.toml uses `{{PLACEHOLDER}}` format
- [ ] No real IDs committed to repository
- [ ] CI/CD substitutes placeholders before deployment
- [ ] Guard steps validate placeholder presence

### ✅ Infrastructure Consistency
- [ ] Terraform validates successfully
- [ ] outputs.tf uses single hostname variable
- [ ] No references to dual-hostname variables
- [ ] Environment variables configured

## Manual Validation Commands

### Check Project Config
```bash
node -e "console.log(JSON.stringify(require('./project.config.json'), null, 2))"
```

### Check Terraform
```bash
cd infra && terraform validate && terraform plan
```

### Check Wrangler Config
```bash
cd app && grep -E "{{.*}}" wrangler.toml
```

### Check Deploy Pipeline
```bash
grep -n "working-directory: app" .github/workflows/deploy.yml
```

## Getting Help

1. **Run validation first**: Use `node scripts/validate.js` or `.\scripts\validate.ps1`
2. **Check specific errors**: Use verbose output for detailed information
3. **Review documentation**: See `docs/README.md` for architecture decisions
4. **Regenerate config**: Use `scripts/setup.js` to reset configuration
5. **Check agents.md**: Reference for AI agent troubleshooting

## Emergency Reset

If project is in inconsistent state:

```bash
# 1. Backup any custom changes
cp app/src/custom/* /backup/ 2>/dev/null || true

# 2. Regenerate configuration
node scripts/setup.js yourdomain.com "Your Description"

# 3. Validate
node scripts/validate.js

# 4. Restore custom changes
cp /backup/* app/src/custom/ 2>/dev/null || true
```

## Performance Troubleshooting

### Slow Local Development
- Check Node.js version (requires 20+)
- Clear npm cache: `npm cache clean --force`
- Remove node_modules: `rm -rf app/node_modules && cd app && npm install`

### Deployment Failures
- Verify environment variables in CI/CD
- Check Cloudflare API token permissions
- Ensure infrastructure deployed before application
- Validate D1 database and KV namespace exist

### Runtime Issues
- Check Wrangler logs: `wrangler tail`
- Verify bindings in deployed worker
- Check D1 database schema: `wrangler d1 execute DB_NAME --command "SELECT name FROM sqlite_master WHERE type='table';"`
- Clear KV cache if content stale