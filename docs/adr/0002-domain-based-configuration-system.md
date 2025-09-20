# ADR 0002: Domain-Based Configuration System

## Status

Accepted

## Context

The original project was hardcoded for "crockyclub.com" with specific resource names throughout the codebase. This created several challenges:

- **Reusability**: The project template couldn't be easily adapted for other domains
- **Consistency**: Resource names were manually defined and could become inconsistent
- **Maintenance**: Changing domain names required manual updates across multiple files
- **Documentation**: All examples and documentation were domain-specific

We needed a way to make the project template truly reusable while maintaining consistent naming conventions across all Cloudflare resources.

## Decision

We will implement a domain-based configuration system with the following characteristics:

### Configuration File Structure
- `project.config.json` as the single source of truth for naming
- JSON Schema validation to ensure consistent naming patterns
- Automatic derivation of all resource names from the primary domain

### Naming Convention Rules
```
Domain: example.com
├─ project_name: "example" (subdomain extracted)
├─ db_name: "example_db" (snake_case with _db suffix)
├─ kv_namespace: "EXAMPLE_PUBLISHED" (UPPER_CASE with _PUBLISHED suffix)
├─ r2_bucket: "example-media" (kebab-case with -media suffix)
├─ worker_names: 
│  ├─ frontend: "example-web"
│  └─ cms: "example-admin"
└─ hostnames:
   ├─ root: "example.com" (original domain)
   └─ admin: "admin.example.com" (admin subdomain)
```

### Tooling Components
1. **Configuration Generator** (`generate-config.js`): Creates project.config.json from domain input
2. **Project Scaffolder** (`setup-project.js`): Generates complete project structure with proper naming
3. **Template Substitution** (`substitute-templates.js`): Replaces template variables with actual values
4. **JSON Schema**: Validates configuration format and naming patterns

### Template System
- Use `{{TEMPLATE_VAR}}` syntax in documentation and configuration files
- Template variables map directly to configuration values
- Scripts can substitute templates with actual values when needed

## Consequences

### Positive

- **Full Reusability**: Any domain can be configured in minutes
- **Consistency**: All resource names follow predictable patterns
- **Type Safety**: JSON Schema validation prevents naming errors
- **Automation**: Scripts handle all boilerplate generation
- **Documentation**: Examples remain relevant for any domain
- **Maintainability**: Single source of truth for all naming decisions

### Negative

- **Additional Complexity**: New developers need to understand the configuration system
- **Breaking Change**: Existing hardcoded references needed migration
- **Script Dependencies**: Project setup now requires Node.js tooling

### Neutral

- **Learning Curve**: Teams must adapt to template-driven development
- **Validation Overhead**: Configuration changes require validation steps

## Implementation Details

### Configuration Schema
The system enforces specific naming patterns:
- **project_name**: `^[a-z][a-z0-9]*$` (lowercase alphanumeric, starting with letter)
- **db_name**: `^[a-z][a-z0-9_]*$` (lowercase with underscores)
- **kv_namespace**: `^[A-Z][A-Z0-9_]*$` (uppercase with underscores)
- **r2_bucket**: `^[a-z][a-z0-9-]*[a-z0-9]$` (lowercase with hyphens)
- **hostnames**: Valid domain format validation

### File Generation
The setup script creates:
- Terraform configurations with proper variable substitution
- Wrangler.toml files with correct bindings
- Package.json files with domain-specific names
- Directory structure matching monorepo conventions

### Documentation Strategy
- Template variables in WARP.md for domain-agnostic examples
- Configuration section explains setup process
- ADRs document architectural decisions and evolution
- Diagrams use template variables for generic architecture views

## Migration Path

For existing projects:
1. Run `node scripts/generate-config.js current-domain.com` 
2. Review generated configuration
3. Update any remaining hardcoded references
4. Test deployment with new configuration

For new projects:
1. Run `node scripts/setup-project.js new-domain.com "Description"`
2. Configure Cloudflare credentials
3. Deploy infrastructure with Terraform
4. Start development

## Monitoring and Validation

- JSON Schema validation prevents invalid configurations
- Scripts include error handling and validation
- Git hooks could enforce configuration consistency
- Documentation includes troubleshooting for common issues

## Future Considerations

- Environment-specific configurations (dev, staging, prod)
- Multi-region deployment configurations
- Integration with CI/CD for automated validation
- Additional resource types as Cloudflare platform evolves

## Date

2025-09-19