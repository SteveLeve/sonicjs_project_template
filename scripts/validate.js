#!/usr/bin/env node

/**
 * SonicJS Community Website Template - Project Validation Script
 * 
 * Comprehensive validation of project setup following the exact sequence
 * a new user would follow. Identifies common issues and provides actionable fixes.
 * 
 * Usage: node scripts/validate.js [--fix] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color output utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message, prefix = '') {
  console.log(`${colors[color]}${prefix}${message}${colors.reset}`);
}

function header(message) {
  log('cyan', `\n🧪 ${message}`, '');
  log('cyan', '='.repeat(message.length + 3), '');
}

function success(message) {
  log('green', message, '✅ ');
}

function warning(message) {
  log('yellow', message, '⚠️  ');
}

function error(message) {
  log('red', message, '❌ ');
}

function info(message) {
  log('blue', message, 'ℹ️  ');
}

// Validation state
const results = {
  passed: [],
  failed: [],
  warnings: [],
  fixes: []
};

function addResult(type, category, message, fix = null) {
  results[type].push({ category, message, fix });
}

// Validation functions
async function validateProjectConfiguration() {
  header('Project Configuration Validation');
  
  try {
    // Check project.config.json exists and is valid
    if (!fs.existsSync('project.config.json')) {
      addResult('failed', 'config', 'project.config.json not found', 
        'Run: node scripts/setup.js yourdomain.com "Your Description"');
      return;
    }
    
    const config = JSON.parse(fs.readFileSync('project.config.json', 'utf8'));
    success('Project config loaded successfully');
    
    // Validate domain format
    const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!domainRegex.test(config.domain)) {
      addResult('failed', 'config', `Invalid domain format: ${config.domain}`,
        'Use lowercase domain like "example.com"');
    } else {
      success(`Domain format valid: ${config.domain}`);
    }
    
    // Validate naming conventions
    const expectedProject = config.domain.split('.')[0];
    if (config.project.name !== expectedProject) {
      addResult('failed', 'config', 'Project name doesn\'t match domain',
        `Expected: ${expectedProject}, Got: ${config.project.name}`);
    } else {
      success('Project name follows domain convention');
    }
    
    // Validate resource naming
    const expectedDb = `${config.project.name}_db`;
    if (config.resources.database !== expectedDb) {
      addResult('failed', 'config', 'Database name doesn\'t follow convention',
        `Expected: ${expectedDb}, Got: ${config.resources.database}`);
    } else {
      success('Database name follows convention');
    }
    
    // Check for single hostname (not dual-worker)
    if (config.resources.hostname === config.domain) {
      success('Single hostname architecture confirmed');
    } else {
      addResult('failed', 'config', 'Hostname architecture mismatch',
        'Should use single hostname with /admin routes');
    }
    
    addResult('passed', 'config', 'Project configuration validation completed');
    
  } catch (error) {
    addResult('failed', 'config', `Configuration error: ${error.message}`);
  }
}

async function validateInfrastructure() {
  header('Infrastructure Validation');
  
  try {
    // Check Terraform files exist
    const terraformFiles = ['main.tf', 'variables.tf', 'outputs.tf', 'versions.tf'];
    for (const file of terraformFiles) {
      const filePath = path.join('infra', file);
      if (!fs.existsSync(filePath)) {
        addResult('failed', 'terraform', `Missing Terraform file: ${file}`);
      } else {
        success(`Terraform file exists: ${file}`);
      }
    }
    
    // Validate Terraform syntax
    try {
      execSync('cd infra && terraform validate', { stdio: 'pipe' });
      success('Terraform configuration is valid');
    } catch (error) {
      addResult('failed', 'terraform', 'Terraform validation failed',
        'Check terraform validate output for syntax errors');
    }
    
    // Check for environment variables
    const requiredEnvVars = ['TF_VAR_cloudflare_api_token', 'CF_ACCOUNT_ID', 'CF_ZONE_ID'];
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        success(`Environment variable set: ${envVar}`);
      } else {
        addResult('warnings', 'terraform', `Environment variable not set: ${envVar}`,
          'Set in your shell or CI/CD environment');
      }
    }
    
    // Check outputs.tf for old dual-hostname references
    const outputsContent = fs.readFileSync('infra/outputs.tf', 'utf8');
    if (outputsContent.includes('root_hostname') || outputsContent.includes('admin_hostname')) {
      addResult('failed', 'terraform', 'outputs.tf contains old dual-hostname references',
        'Update to use single hostname variable');
    } else {
      success('outputs.tf uses correct single-hostname architecture');
    }
    
    addResult('passed', 'terraform', 'Infrastructure validation completed');
    
  } catch (error) {
    addResult('failed', 'terraform', `Infrastructure validation error: ${error.message}`);
  }
}

async function validateApplicationStructure() {
  header('Application Structure Validation');
  
  try {
    // Check app directory exists (not apps)
    if (fs.existsSync('apps')) {
      addResult('failed', 'app', 'Old apps/ directory found',
        'Remove apps/ directory - should use single app/ directory');
    }
    
    if (!fs.existsSync('app')) {
      addResult('failed', 'app', 'app/ directory not found',
        'Create app/ directory structure');
      return;
    }
    
    success('Single app/ directory structure confirmed');
    
    // Check essential files
    const requiredFiles = [
      'app/package.json',
      'app/wrangler.toml',
      'app/migrations'
    ];
    
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        success(`Required file/directory exists: ${file}`);
      } else {
        addResult('failed', 'app', `Missing required file/directory: ${file}`,
          'Create missing application structure');
      }
    }
    
    // Validate package.json
    if (fs.existsSync('app/package.json')) {
      const pkg = JSON.parse(fs.readFileSync('app/package.json', 'utf8'));
      const requiredScripts = ['dev', 'build', 'deploy', 'db:migrate'];
      
      for (const script of requiredScripts) {
        if (pkg.scripts && pkg.scripts[script]) {
          success(`Required script defined: ${script}`);
        } else {
          addResult('failed', 'app', `Missing package.json script: ${script}`,
            'Add required npm scripts to package.json');
        }
      }
    }
    
    // Check for migration files
    if (fs.existsSync('app/migrations')) {
      const migrations = fs.readdirSync('app/migrations').filter(f => f.endsWith('.sql'));
      if (migrations.length > 0) {
        success(`Database migrations found: ${migrations.length} files`);
      } else {
        addResult('warnings', 'app', 'No database migration files found',
          'Create initial database schema migration');
      }
    }
    
    addResult('passed', 'app', 'Application structure validation completed');
    
  } catch (error) {
    addResult('failed', 'app', `Application validation error: ${error.message}`);
  }
}

async function validateWranglerConfiguration() {
  header('Wrangler Configuration Validation');
  
  try {
    if (!fs.existsSync('app/wrangler.toml')) {
      addResult('failed', 'wrangler', 'wrangler.toml not found');
      return;
    }
    
    const wranglerContent = fs.readFileSync('app/wrangler.toml', 'utf8');
    
    // Check for required placeholders
    const requiredPlaceholders = ['{{D1_DATABASE_ID}}', '{{KV_NAMESPACE_ID}}'];
    for (const placeholder of requiredPlaceholders) {
      if (wranglerContent.includes(placeholder)) {
        success(`Placeholder found: ${placeholder}`);
      } else {
        addResult('failed', 'wrangler', `Missing placeholder: ${placeholder}`,
          'Ensure wrangler.toml uses placeholders for CI substitution');
      }
    }
    
    // Check for required bindings
    const requiredBindings = ['d1_databases', 'kv_namespaces', 'r2_buckets'];
    for (const binding of requiredBindings) {
      if (wranglerContent.includes(binding)) {
        success(`Binding section found: ${binding}`);
      } else {
        addResult('failed', 'wrangler', `Missing binding section: ${binding}`,
          'Add required resource bindings to wrangler.toml');
      }
    }
    
    // Check worker name
    if (wranglerContent.includes('name = ')) {
      success('Worker name defined');
    } else {
      addResult('failed', 'wrangler', 'Worker name not defined',
        'Add name = "project-name" to wrangler.toml');
    }
    
    addResult('passed', 'wrangler', 'Wrangler configuration validation completed');
    
  } catch (error) {
    addResult('failed', 'wrangler', `Wrangler validation error: ${error.message}`);
  }
}

async function validateDeployPipeline() {
  header('Deploy Pipeline Validation');
  
  try {
    if (!fs.existsSync('.github/workflows/deploy.yml')) {
      addResult('warnings', 'deploy', 'GitHub Actions deploy workflow not found',
        'Create .github/workflows/deploy.yml for automated deployment');
      return;
    }
    
    const deployContent = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');
    
    // Check for single-worker architecture
    if (deployContent.includes('working-directory: app') && 
        !deployContent.includes('apps/admin-sonicjs') && 
        !deployContent.includes('apps/web-astro')) {
      success('Deploy workflow uses single-worker architecture');
    } else {
      addResult('failed', 'deploy', 'Deploy workflow still references dual-worker setup',
        'Update deploy.yml to use single app/ directory');
    }
    
    // Check for placeholder substitution
    if (deployContent.includes('{{D1_DATABASE_ID}}') && 
        deployContent.includes('{{KV_NAMESPACE_ID}}') && 
        deployContent.includes('sed -i')) {
      success('Placeholder substitution logic present');
    } else {
      addResult('failed', 'deploy', 'Missing placeholder substitution in deploy workflow',
        'Add sed commands to substitute placeholders in CI');
    }
    
    addResult('passed', 'deploy', 'Deploy pipeline validation completed');
    
  } catch (error) {
    addResult('failed', 'deploy', `Deploy pipeline validation error: ${error.message}`);
  }
}

async function displayResults() {
  header('Validation Results Summary');
  
  console.log();
  
  if (results.passed.length > 0) {
    log('green', '✅ PASSED VALIDATIONS:', '');
    results.passed.forEach(result => {
      log('green', `  • ${result.category}: ${result.message}`, '');
    });
    console.log();
  }
  
  if (results.warnings.length > 0) {
    log('yellow', '⚠️  WARNINGS:', '');
    results.warnings.forEach(result => {
      log('yellow', `  • ${result.category}: ${result.message}`, '');
      if (result.fix) {
        log('blue', `    Fix: ${result.fix}`, '');
      }
    });
    console.log();
  }
  
  if (results.failed.length > 0) {
    log('red', '❌ FAILED VALIDATIONS:', '');
    results.failed.forEach(result => {
      log('red', `  • ${result.category}: ${result.message}`, '');
      if (result.fix) {
        log('blue', `    Fix: ${result.fix}`, '');
      }
    });
    console.log();
  } else {
    log('green', '🎉 All validations passed! Project is ready for deployment.', '');
    console.log();
  }
  
  // Next steps
  if (results.failed.length === 0) {
    log('cyan', '🚀 READY FOR:', '');
    log('cyan', '  • Infrastructure deployment (terraform apply)', '');
    log('cyan', '  • SonicJS application setup', '');
    log('cyan', '  • Database migrations', '');
    log('cyan', '  • Production deployment', '');
  }
}

// Main validation runner
async function runValidation() {
  log('cyan', 'SonicJS Community Website Template - Project Validation', '🧪 ');
  log('blue', 'Validating project setup following new user sequence...', '');
  
  await validateProjectConfiguration();
  await validateInfrastructure();
  await validateApplicationStructure();
  await validateWranglerConfiguration();
  await validateDeployPipeline();
  
  await displayResults();
  
  // Exit with error code if any validations failed
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runValidation().catch(error => {
    console.error('Validation script error:', error);
    process.exit(1);
  });
}

module.exports = { runValidation };