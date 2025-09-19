#!/usr/bin/env node

/**
 * SonicJS Community Website Template Setup
 * 
 * This script configures the entire project for your domain and generates
 * all necessary files with proper naming conventions.
 * 
 * Usage: node scripts/setup.js yourdomain.com "Your Community Description"
 */

const fs = require('fs');
const path = require('path');

// Color output for better UX
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateProjectConfig(domain, description) {
  // Extract project name from domain (remove TLD and special chars)
  const projectName = domain.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const projectNameUpper = projectName.toUpperCase();
  
  return {
    domain,
    project: {
      name: projectName,
      description: description || `A community website built with SonicJS template`,
      version: '1.0.0'
    },
    cloudflare: {
      account_id: "{{CLOUDFLARE_ACCOUNT_ID}}",
      zone_id: "{{CLOUDFLARE_ZONE_ID}}"
    },
    resources: {
      database: `${projectName}_db`,
      kv_namespace: `${projectNameUpper}_PUBLISHED`,
      r2_bucket: `${projectName}-media`,
      workers: {
        frontend: `${projectName}-web`,
        cms: `${projectName}-admin`
      },
      hostnames: {
        root: domain,
        admin: `admin.${domain}`
      }
    }
  };
}

function validateDomain(domain) {
  const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    throw new Error('Invalid domain format. Use lowercase domain like "example.com"');
  }
  
  const parts = domain.split('.');
  if (parts.length < 2) {
    throw new Error('Domain must have at least a name and TLD (e.g., "example.com")');
  }
  
  const projectName = parts[0].replace(/[^a-z0-9]/g, '');
  if (projectName.length === 0) {
    throw new Error('Domain must start with alphanumeric characters');
  }
  
  return true;
}

function createProjectConfigFile(config) {
  const configPath = path.join(process.cwd(), 'project.config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

function generateTerraformFiles(config) {
  const terraformDir = path.join(process.cwd(), 'infra');
  
  // versions.tf
  const versionsContent = `terraform {
  required_version = ">= 1.6.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 5.0"
    }
  }
}`;

  // variables.tf
  const variablesContent = `# Cloudflare Configuration
variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API token with Worker, D1, R2, KV, and DNS permissions"
}

variable "account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "zone_id" {
  type        = string
  description = "Cloudflare zone ID for ${config.domain}"
}

# Project Configuration
variable "project_name" {
  type        = string
  default     = "${config.project.name}"
  description = "Base project name"
}

# Resource Names (auto-generated from project config)
variable "database_name" {
  type        = string
  default     = "${config.resources.database}"
  description = "D1 database name"
}

variable "kv_namespace_name" {
  type        = string
  default     = "${config.resources.kv_namespace}"
  description = "KV namespace name"
}

variable "r2_bucket_name" {
  type        = string
  default     = "${config.resources.r2_bucket}"
  description = "R2 bucket name"
}

# Hostnames
variable "root_hostname" {
  type        = string
  default     = "${config.resources.hostnames.root}"
  description = "Root domain hostname"
}

variable "admin_hostname" {
  type        = string
  default     = "${config.resources.hostnames.admin}"
  description = "Admin subdomain hostname"
}`;

  // main.tf
  const mainContent = `provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Data source for the zone
data "cloudflare_zone" "main" {
  zone_id = var.zone_id
}

# --- Storage Resources ---
resource "cloudflare_workers_kv_namespace" "published" {
  account_id = var.account_id
  title      = var.kv_namespace_name
}

resource "cloudflare_d1_database" "main" {
  account_id = var.account_id
  name       = var.database_name
}

resource "cloudflare_r2_bucket" "media" {
  account_id = var.account_id
  name       = var.r2_bucket_name
}

# --- DNS Records ---
resource "cloudflare_record" "root" {
  zone_id = var.zone_id
  name    = "@"
  type    = "A"
  content = "192.0.2.1"     # placeholder IP; proxied so origin is hidden
  proxied = true
  comment = "Root domain for \${var.project_name} frontend"
}

resource "cloudflare_record" "admin" {
  zone_id = var.zone_id
  name    = "admin"
  type    = "A"
  content = "192.0.2.1"
  proxied = true
  comment = "Admin subdomain for \${var.project_name} CMS"
}`;

  // outputs.tf
  const outputsContent = `# Resource IDs for Wrangler configuration
output "kv_namespace_id" {
  value       = cloudflare_workers_kv_namespace.published.id
  description = "KV namespace ID for content caching"
}

output "d1_database_id" {
  value       = cloudflare_d1_database.main.id
  description = "D1 database ID"
}

output "r2_bucket_name" {
  value       = cloudflare_r2_bucket.media.name
  description = "R2 bucket name for media storage"
}

# Configuration summary
output "project_info" {
  value = {
    project_name   = var.project_name
    root_hostname  = var.root_hostname
    admin_hostname = var.admin_hostname
    zone_name      = data.cloudflare_zone.main.name
  }
  description = "Project configuration summary"
}

output "resource_names" {
  value = {
    database     = var.database_name
    kv_namespace = var.kv_namespace_name
    r2_bucket    = var.r2_bucket_name
  }
  description = "Generated resource names"
}`;

  // Write all Terraform files
  const terraformFiles = {
    'versions.tf': versionsContent,
    'variables.tf': variablesContent,
    'main.tf': mainContent,
    'outputs.tf': outputsContent
  };

  Object.entries(terraformFiles).forEach(([filename, content]) => {
    const filePath = path.join(terraformDir, filename);
    fs.writeFileSync(filePath, content);
    log('green', `  📄 Created: infra/${filename}`);
  });
}

function generateWranglerConfigs(config) {
  // CMS Wrangler config
  const cmsWranglerContent = `name = "${config.resources.workers.cms}"
main = "src/index.ts"
compatibility_date = "2025-09-17"

# Bindings - IDs filled by Terraform outputs
[[d1_databases]]
binding = "DB"
database_name = "${config.resources.database}"
database_id = "{{D1_DATABASE_ID}}"    # Replaced by CI/CD

[[kv_namespaces]]
binding = "PUBLISHED"
id = "{{KV_NAMESPACE_ID}}"             # Replaced by CI/CD

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "${config.resources.r2_bucket}"

[vars]
PROJECT_NAME = "${config.project.name}"
ADMIN_HOST = "${config.resources.hostnames.admin}"
CORS_ORIGIN = "https://${config.resources.hostnames.root}"`;

  // Frontend Wrangler config  
  const frontendWranglerContent = `name = "${config.resources.workers.frontend}"
main = "dist/_worker.js"              # Generated by Astro adapter
compatibility_date = "2025-09-17"
assets = { directory = "dist" }

# Bindings - IDs filled by Terraform outputs
[[d1_databases]]
binding = "DB"
database_name = "${config.resources.database}"
database_id = "{{D1_DATABASE_ID}}"    # Replaced by CI/CD

[[kv_namespaces]]
binding = "PUBLISHED"
id = "{{KV_NAMESPACE_ID}}"             # Replaced by CI/CD

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "${config.resources.r2_bucket}"

[vars]
PROJECT_NAME = "${config.project.name}"
ADMIN_API = "https://${config.resources.hostnames.admin}/api"
SITE_URL = "https://${config.resources.hostnames.root}"`;

  // Write Wrangler configs
  const cmsPath = path.join('apps', 'admin-sonicjs', 'wrangler.toml');
  const frontendPath = path.join('apps', 'web-astro', 'wrangler.toml');
  
  fs.writeFileSync(cmsPath, cmsWranglerContent);
  fs.writeFileSync(frontendPath, frontendWranglerContent);
  
  log('green', `  📄 Created: ${cmsPath}`);
  log('green', `  📄 Created: ${frontendPath}`);
}

function generatePackageJsonFiles(config) {
  // CMS package.json
  const cmsPackageJson = {
    name: `${config.project.name}-admin`,
    private: true,
    version: config.project.version,
    description: `Admin CMS for ${config.project.description}`,
    scripts: {
      dev: "wrangler dev",
      deploy: "wrangler deploy",
      migrate: `wrangler d1 migrations apply ${config.resources.database}`,
      "migrate:local": `wrangler d1 migrations apply ${config.resources.database} --local`
    },
    dependencies: {
      sonicjs: "^1.0.0"
    },
    devDependencies: {
      wrangler: "^3.76.0"
    }
  };

  // Frontend package.json
  const frontendPackageJson = {
    name: `${config.project.name}-web`,
    private: true,
    version: config.project.version,
    description: `Frontend for ${config.project.description}`,
    scripts: {
      dev: "wrangler dev",
      build: "astro build",
      deploy: "wrangler deploy",
      preview: "astro preview"
    },
    dependencies: {
      astro: "^4.16.0",
      "@astrojs/cloudflare": "^10.0.0",
      "@astrojs/react": "^3.6.2",
      react: "^18.3.1",
      "react-dom": "^18.3.1"
    },
    devDependencies: {
      "@types/react": "^18.3.8",
      "@types/react-dom": "^18.3.0",
      typescript: "^5.6.2",
      wrangler: "^3.76.0"
    }
  };

  // Write package.json files
  const cmsPackagePath = path.join('apps', 'admin-sonicjs', 'package.json');
  const frontendPackagePath = path.join('apps', 'web-astro', 'package.json');
  
  fs.writeFileSync(cmsPackagePath, JSON.stringify(cmsPackageJson, null, 2));
  fs.writeFileSync(frontendPackagePath, JSON.stringify(frontendPackageJson, null, 2));
  
  log('green', `  📄 Created: ${cmsPackagePath}`);
  log('green', `  📄 Created: ${frontendPackagePath}`);
}

function displaySummary(config) {
  log('cyan', '\n🎉 Project setup complete!\n');
  
  log('bright', '📋 Configuration Summary:');
  log('blue', `  Domain: ${config.domain}`);
  log('blue', `  Project: ${config.project.name}`);
  log('blue', `  Description: ${config.project.description}`);
  
  log('bright', '\n🏗️ Generated Resources:');
  log('blue', `  Database: ${config.resources.database}`);
  log('blue', `  KV Namespace: ${config.resources.kv_namespace}`);
  log('blue', `  R2 Bucket: ${config.resources.r2_bucket}`);
  log('blue', `  Frontend Worker: ${config.resources.workers.frontend}`);
  log('blue', `  CMS Worker: ${config.resources.workers.cms}`);
  
  log('bright', '\n🌐 Hostnames:');
  log('blue', `  Frontend: https://${config.resources.hostnames.root}`);
  log('blue', `  Admin: https://${config.resources.hostnames.admin}/admin`);
  
  log('bright', '\n📋 Next Steps:');
  log('yellow', '1. Get your Cloudflare API token and account/zone IDs');
  log('yellow', '2. Update project.config.json with your Cloudflare IDs');
  log('yellow', '3. Deploy infrastructure: cd infra && terraform init && terraform apply');
  log('yellow', '4. Install dependencies: cd apps/admin-sonicjs && npm install');
  log('yellow', '5. Run migrations: npm run migrate');
  log('yellow', '6. Start development: npm run dev');
  
  log('bright', '\n📖 Documentation:');
  log('cyan', '  WARP.md - Complete developer guide');
  log('cyan', '  docs/ - Architecture docs and diagrams');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('red', '❌ Missing required arguments');
    console.log('Usage: node scripts/setup.js <domain> [description]');
    console.log('Example: node scripts/setup.js mysite.com "My awesome community"');
    process.exit(1);
  }
  
  const domain = args[0].toLowerCase();
  const description = args[1] || '';
  
  try {
    log('cyan', `\n🚀 Setting up SonicJS Community Website for: ${domain}\n`);
    
    // Validate domain
    validateDomain(domain);
    log('green', '✅ Domain validation passed');
    
    // Generate configuration
    const config = generateProjectConfig(domain, description);
    const configPath = createProjectConfigFile(config);
    log('green', `✅ Generated configuration: ${path.basename(configPath)}`);
    
    // Generate Terraform files
    log('bright', '\n📦 Generating Terraform infrastructure...');
    generateTerraformFiles(config);
    
    // Generate Wrangler configs
    log('bright', '\n⚙️ Generating Wrangler configurations...');
    generateWranglerConfigs(config);
    
    // Generate package.json files
    log('bright', '\n📦 Generating package.json files...');
    generatePackageJsonFiles(config);
    
    // Show summary
    displaySummary(config);
    
  } catch (error) {
    log('red', `\n❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateProjectConfig, validateDomain };