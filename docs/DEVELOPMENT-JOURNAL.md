# Development Journal

This document captures the ongoing evolution, intentions, and design decisions for this project template.

## Project Vision Evolution

**Original Concept (September 19, 2025):**
- Plushie community website (CrockyClub.com) 
- Cloudflare Workers + Astro + SonicJS
- Hardcoded for specific domain

**Current Vision (September 19, 2025):**
- **Reusable community website template** 
- Domain-configurable for any niche community
- Complete developer experience with tooling
- Self-documenting architecture

## Key Design Decisions

### 1. Domain-Based Configuration System
**Why:** Make the template truly reusable beyond just the original plushie community use case.

**How:** 
- Automatic name derivation from domain input
- JSON schema validation for consistency  
- Template variable system in documentation
- Complete tooling suite for setup/management

**Impact:** Any developer can now spin up a community site for their domain in minutes.

### 2. Comprehensive Documentation Strategy
**Why:** Following user rule about "intention before action" - document the design process in detail.

**How:**
- WARP.md as single source of truth for development
- ADRs capturing architectural decisions  
- Mermaid diagrams for visual architecture
- Development journal (this file) for ongoing intentions

**Impact:** Future developers (including AI assistants) can understand not just what but why.

### 3. Monorepo with Edge-First Architecture
**Why:** Leverage Cloudflare's global network for community sites that need worldwide performance.

**How:**
- Separate Workers for frontend (Astro) and CMS (SonicJS)
- D1 for database, KV for caching, R2 for media
- Terraform for infrastructure as code
- GitHub Actions for automated deployment

**Impact:** Sites deploy globally with sub-100ms latency and scale automatically.

## Current Phase: Template Maturation

### Completed ✅
- [x] Basic project structure and documentation
- [x] Domain-based configuration system
- [x] Complete tooling suite (generate, setup, substitute)
- [x] Template variable system
- [x] WARP.md developer handbook
- [x] Architecture decision records
- [x] System diagrams with configurable naming
- [x] **ADR-0002**: SonicJS integration architecture pivot
- [x] **Documentation cleanup**: Aligned all docs with single-worker architecture
- [x] **Hostname consolidation**: Single domain with `/admin` routes
- [x] **Obsolete code removal**: Cleaned up dual-worker references

### In Progress 🚧
- [ ] **SonicJS Integration**: Implement actual `app/` directory with integrated SonicJS
- [ ] **Terraform Updates**: Update `main.tf` and `outputs.tf` for single-worker model
- [ ] **End-to-End Testing**: Verify automated setup workflow works completely

### Next Priorities 📋

#### Immediate (This Week)
1. **Create actual infra/ directory** with working Terraform configurations
2. **Scaffold apps/web-astro/** with functional Astro + Cloudflare adapter setup
3. **Scaffold apps/admin-sonicjs/** with working SonicJS CMS
4. **Database migrations** for posts, submissions, authors tables
5. **GitHub Actions workflow** for automated deployment

#### Short Term (Next 2 Weeks)  
1. **Content management interface** in SonicJS admin
2. **Frontend pages** in Astro (home, blog, submission form)
3. **API integration** between Astro frontend and SonicJS backend
4. **Basic styling** and responsive design
5. **Testing strategy** and initial tests

#### Medium Term (Next Month)
1. **Content seeding** with example posts/spotlights
2. **Performance optimization** and caching strategy
3. **Security review** and best practices implementation
4. **Documentation completion** including API docs
5. **Community feedback** and iteration

## Ongoing Intentions

### For Community Site Template
This should become the **go-to template** for launching niche community websites on Cloudflare Workers. Key characteristics:

- **Zero to deployment in < 30 minutes** for new domains
- **Production-ready** with security, performance, monitoring
- **Community-focused features** (content submission, moderation, spotlights)
- **Cost-effective** (scales from $0 to thousands of users)
- **Global performance** (sub-100ms worldwide via edge deployment)

### For Development Experience
Every aspect should prioritize **developer productivity**:

- **Self-documenting** - WARP.md answers all "how do I..." questions
- **Automated tooling** - scripts handle all boilerplate and configuration
- **Clear architecture** - request flow and data patterns are obvious
- **Incremental deployment** - can build and deploy features independently
- **Testing-friendly** - local development mimics production closely

### For Documentation Strategy
Following the "intention before action" rule:

- **ADRs capture decisions** before they're implemented
- **Diagrams show design** before code is written  
- **WARP.md explains usage** before features are built
- **This journal tracks evolution** as we learn and adapt

## Open Questions & Decisions Needed

### Technical
- **Authentication strategy**: Start with admin-only or build user accounts early?
- **Content types**: How generic vs. specific should the CMS schema be?
- **Media handling**: What's the optimal image processing/CDN strategy?
- **SEO optimization**: How to handle meta tags, sitemaps, structured data?

### Product
- **Target communities**: Should we optimize for specific niches or stay completely generic?
- **Feature scope**: What's the minimum viable community site vs. full-featured?
- **Customization level**: How much should sites be able to customize appearance/features?

### Process
- **Testing strategy**: What level of automated testing is appropriate for a template?
- **Version management**: How do we handle updates to the template without breaking existing sites?
- **Community building**: Should we create a community around the template itself?

## Research & Learning Log

### Cloudflare Workers Patterns
- **Cold start optimization**: Minimal dependencies, lazy loading
- **Edge caching strategies**: KV for read-heavy, D1 for writes  
- **Request routing**: Subdomain vs. path-based API separation
- **Resource binding**: Environment-specific configurations

### Community Site Requirements
- **Content moderation**: Automated + human review workflows
- **User engagement**: Comments, reactions, user profiles
- **Content discovery**: Search, filtering, related content
- **Mobile experience**: Progressive web app considerations

### Template Design Patterns
- **Configuration management**: Single source of truth approaches
- **Documentation strategy**: Developer handbook best practices  
- **Tooling design**: CLI vs. scripts vs. GUI approaches
- **Deployment automation**: Infrastructure + application coordination

---

**Last Updated:** September 20, 2025  
**Next Review:** Weekly (every Thursday)  
**Maintainer:** Development team + AI assistants

## Recent Learnings (September 20, 2025)

### Major Architectural Pivot: SonicJS Integration Strategy

**Discovery:** Our initial dual-worker architecture (separate CMS + frontend) fundamentally misunderstood SonicJS design patterns.

**Root Issue:** SonicJS is designed as a **single integrated Astro application** with admin UI at `/admin` routes, not separate workers.

**Evidence:** 
- Official SonicJS repo shows unified `wrangler.toml` and single deployment
- Admin interface served from same worker at `/admin` paths
- No separate domain/subdomain patterns in SonicJS documentation
- Single Astro build process generates both public and admin UI

### Documentation-First Cleanup Process

**Process Followed:**
1. **Created ADR-0002** documenting the architectural pivot decision
2. **Updated all documentation** (WARP.md, README.md, integration strategy) 
3. **Removed obsolete code** (deleted `apps/` directories)
4. **Consolidated hostname architecture** (single domain, no admin subdomain)

**Key Insight:** Documentation cleanup **before** implementation prevents architectural drift and confusion.

### Hostname Architecture Lessons

**Original Approach:** Separate domains (`domain.com` + `admin.domain.com`)
**Corrected Approach:** Single domain with route-based admin (`domain.com/admin`)

**Files Updated:**
- `scripts/setup.js` - Single worker config generation
- `infra/variables.tf` - Removed admin hostname variable  
- `.github/copilot-instructions.md` - Aligned with current architecture
- `project.config.schema.json` - Updated validation schema

**Impact:** Simplified DNS setup, reduced infrastructure complexity, aligned with SonicJS patterns.

### Template vs. Framework Understanding

**Learning:** We're building a **template that integrates SonicJS**, not a wrapper around it.

**Implications:**
- Preserve SonicJS upgrade path and customization patterns
- Add automation around SonicJS setup (domain config, resource provisioning)
- Enhance with community-specific schemas and workflows
- Maintain clear separation between template automation and SonicJS core

### Next Phase: Implementation Strategy

**Current State:** Clean architecture, aligned documentation, ready for implementation.

**Immediate Next Steps:**
1. **Implement `app/` directory** with actual SonicJS integration
2. **Update Terraform** `main.tf` and `outputs.tf` to match new single-worker model
3. **Test automated setup** end-to-end workflow
4. **Add community-specific content schemas** to SonicJS configuration

**Success Metrics:**
- `node scripts/setup.js domain.com "Description"` → working SonicJS site
- Documentation matches implementation reality
- Clear upgrade path for future SonicJS releases

---

