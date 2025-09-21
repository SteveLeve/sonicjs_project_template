# SonicJS Community Website Template - PowerShell Validation Script
# 
# Quick validation of project setup for Windows users
# Usage: .\scripts\validate.ps1 [-Verbose]

param(
    [switch]$Verbose
)

# Color functions
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Blue }
function Write-Header { param($Message) Write-Host "`n🧪 $Message" -ForegroundColor Cyan; Write-Host ("=" * ($Message.Length + 3)) -ForegroundColor Cyan }

# Validation counters
$script:PassedTests = 0
$script:FailedTests = 0
$script:Warnings = 0

function Test-ProjectConfiguration {
    Write-Header "Project Configuration"
    
    if (-not (Test-Path "project.config.json")) {
        Write-Error "project.config.json not found"
        Write-Info "Fix: Run 'node scripts/setup.js yourdomain.com `"Your Description`"'"
        $script:FailedTests++
        return
    }
    
    try {
        $config = Get-Content "project.config.json" | ConvertFrom-Json
        Write-Success "Project config loaded: $($config.domain)"
        
        # Domain format validation
        if ($config.domain -match "^[a-z0-9.-]+\.[a-z]{2,}$") {
            Write-Success "Domain format valid"
        } else {
            Write-Error "Invalid domain format: $($config.domain)"
            $script:FailedTests++
        }
        
        # Single hostname check
        if ($config.resources.hostname -eq $config.domain) {
            Write-Success "Single hostname architecture confirmed"
        } else {
            Write-Error "Hostname architecture mismatch"
            $script:FailedTests++
        }
        
        $script:PassedTests++
    }
    catch {
        Write-Error "Configuration parsing error: $($_.Exception.Message)"
        $script:FailedTests++
    }
}

function Test-Infrastructure {
    Write-Header "Infrastructure"
    
    $terraformFiles = @("main.tf", "variables.tf", "outputs.tf", "versions.tf")
    $missingFiles = @()
    
    foreach ($file in $terraformFiles) {
        if (Test-Path "infra\$file") {
            Write-Success "Terraform file exists: $file"
        } else {
            Write-Error "Missing Terraform file: $file"
            $missingFiles += $file
            $script:FailedTests++
        }
    }
    
    if ($missingFiles.Count -eq 0) {
        # Test Terraform validation
        try {
            $result = & terraform -chdir=infra validate 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Terraform configuration is valid"
            } else {
                Write-Error "Terraform validation failed"
                if ($Verbose) { Write-Host $result -ForegroundColor Red }
                $script:FailedTests++
            }
        }
        catch {
            Write-Warning "Terraform CLI not available for validation"
            $script:Warnings++
        }
        
        $script:PassedTests++
    }
    
    # Environment variables check
    $envVars = @("TF_VAR_cloudflare_api_token", "CF_ACCOUNT_ID", "CF_ZONE_ID")
    foreach ($envVar in $envVars) {
        if (Get-Variable -Name $envVar -Scope Global -ErrorAction SilentlyContinue) {
            Write-Success "Environment variable set: $envVar"
        } else {
            Write-Warning "Environment variable not set: $envVar"
            $script:Warnings++
        }
    }
}

function Test-ApplicationStructure {
    Write-Header "Application Structure"
    
    if (Test-Path "apps") {
        Write-Error "Old apps/ directory found - should use single app/ directory"
        $script:FailedTests++
    }
    
    if (-not (Test-Path "app")) {
        Write-Error "app/ directory not found"
        Write-Info "Fix: Create app/ directory structure"
        $script:FailedTests++
        return
    }
    
    Write-Success "Single app/ directory confirmed"
    
    $requiredPaths = @("app\package.json", "app\wrangler.toml", "app\migrations")
    foreach ($path in $requiredPaths) {
        if (Test-Path $path) {
            Write-Success "Required path exists: $path"
        } else {
            Write-Error "Missing required path: $path"
            $script:FailedTests++
        }
    }
    
    # Check migration files
    if (Test-Path "app\migrations") {
        $migrations = Get-ChildItem "app\migrations\*.sql" -ErrorAction SilentlyContinue
        if ($migrations) {
            Write-Success "Migration files found: $($migrations.Count)"
        } else {
            Write-Warning "No migration files found"
            $script:Warnings++
        }
    }
    
    $script:PassedTests++
}

function Test-WranglerConfiguration {
    Write-Header "Wrangler Configuration"
    
    if (-not (Test-Path "app\wrangler.toml")) {
        Write-Error "wrangler.toml not found"
        $script:FailedTests++
        return
    }
    
    $content = Get-Content "app\wrangler.toml" -Raw
    
    # Placeholder check
    $placeholders = @("{{D1_DATABASE_ID}}", "{{KV_NAMESPACE_ID}}")
    foreach ($placeholder in $placeholders) {
        if ($content -like "*$placeholder*") {
            Write-Success "Placeholder found: $placeholder"
        } else {
            Write-Error "Missing placeholder: $placeholder"
            $script:FailedTests++
        }
    }
    
    # Bindings check
    $bindings = @("d1_databases", "kv_namespaces", "r2_buckets")
    foreach ($binding in $bindings) {
        if ($content -like "*$binding*") {
            Write-Success "Binding section found: $binding"
        } else {
            Write-Error "Missing binding section: $binding"
            $script:FailedTests++
        }
    }
    
    $script:PassedTests++
}

function Test-DeployPipeline {
    Write-Header "Deploy Pipeline"
    
    if (-not (Test-Path ".github\workflows\deploy.yml")) {
        Write-Warning "GitHub Actions deploy workflow not found"
        $script:Warnings++
        return
    }
    
    $content = Get-Content ".github\workflows\deploy.yml" -Raw
    
    # Single-worker architecture check
    if (($content -like "*working-directory: app*") -and 
        ($content -notlike "*apps/admin-sonicjs*") -and 
        ($content -notlike "*apps/web-astro*")) {
        Write-Success "Deploy workflow uses single-worker architecture"
    } else {
        Write-Error "Deploy workflow references old dual-worker setup"
        $script:FailedTests++
    }
    
    # Placeholder substitution check
    if (($content -like "*{{D1_DATABASE_ID}}*") -and 
        ($content -like "*{{KV_NAMESPACE_ID}}*")) {
        Write-Success "Placeholder substitution logic present"
    } else {
        Write-Error "Missing placeholder substitution in deploy workflow"
        $script:FailedTests++
    }
    
    $script:PassedTests++
}

function Show-Results {
    Write-Header "Validation Summary"
    
    Write-Host ""
    if ($script:PassedTests -gt 0) {
        Write-Host "✅ PASSED: $script:PassedTests test categories" -ForegroundColor Green
    }
    
    if ($script:Warnings -gt 0) {
        Write-Host "⚠️  WARNINGS: $script:Warnings items" -ForegroundColor Yellow
    }
    
    if ($script:FailedTests -gt 0) {
        Write-Host "❌ FAILED: $script:FailedTests test categories" -ForegroundColor Red
        Write-Host ""
        Write-Host "Run with -Verbose for detailed error information" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "🎉 All validations passed! Project ready for deployment." -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 READY FOR:" -ForegroundColor Cyan
        Write-Host "  • Infrastructure deployment (terraform apply)" -ForegroundColor Cyan
        Write-Host "  • SonicJS application setup" -ForegroundColor Cyan
        Write-Host "  • Database migrations" -ForegroundColor Cyan
        Write-Host "  • Production deployment" -ForegroundColor Cyan
    }
    
    Write-Host ""
}

# Main execution
Write-Host "🧪 SonicJS Community Website Template - Project Validation" -ForegroundColor Cyan
Write-Host "Validating project setup..." -ForegroundColor Blue

Test-ProjectConfiguration
Test-Infrastructure  
Test-ApplicationStructure
Test-WranglerConfiguration
Test-DeployPipeline

Show-Results

# Exit with appropriate code
if ($script:FailedTests -gt 0) {
    exit 1
} else {
    exit 0
}