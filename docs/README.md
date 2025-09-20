# Documentation

This directory contains architecture decision records (ADRs), diagrams, and technical documentation for the SonicJS Community Website Template project.

## Documentation Philosophy

**Intention Before Action:** All significant changes should be documented before implementation. This prevents architectural drift and ensures thoughtful decision-making.

**Living Documentation:** Documentation evolves with the project, capturing not just what we built, but why we built it and how our thinking changed.

**AI-Friendly Structure:** Clear, consistent formats that enable AI assistants to understand context, rationale, and project evolution.

## Documentation Types & Structure

### Core Documentation

- `README.md` (this file) - Documentation policy and structure overview
- `DEVELOPMENT-JOURNAL.md` - Ongoing project evolution, intentions, and learnings
- `sonicjs-integration-strategy.md` - Technical integration approach and implementation plan

### Architecture Decision Records (`adr/`)

ADRs capture significant architectural decisions following [adr.github.io](https://adr.github.io/) format:

- `0001-secrets-handling.md` - Configuration and secrets management approach
- `0002-sonicjs-integration-pivot.md` - Single-worker architecture decision
- Future ADRs as architecture evolves

### Diagrams (`diagrams/`)

Mermaid diagrams for visual architecture representation:

- System architecture diagrams
- Data flow illustrations  
- Deployment topology
- Request routing patterns

### API Documentation (`api/`)

- SonicJS API schemas and endpoints
- Integration patterns and examples
- Authentication and authorization flows

## Documentation Workflow

### For Architectural Changes

1. **Document First** - Create or update ADR before code changes
2. **Commit Documentation** - Commit ADR and related docs separately
3. **Implement Changes** - Make code changes aligned with documented decisions
4. **Update Journal** - Record learnings and evolution in development journal
5. **Refine Iteratively** - Update documentation as understanding evolves

### For Feature Development

1. **Design Documentation** - Update integration strategy or create feature-specific docs
2. **Implementation** - Build features according to documented approach
3. **Lessons Learned** - Update development journal with insights and patterns

### For Template Usage (External Users)

Primary documentation lives in repository root:

- `README.md` - Quick start and overview
- `WARP.md` - Complete developer handbook and reference

## Documentation Standards

### ADR Format

```markdown
# ADR NNNN: Title

Date: YYYY-MM-DD
Status: [Proposed|Accepted|Deprecated|Superseded]
Context Version: X.Y

## Status
Brief status statement

## Context
What is the issue we're trying to solve?

## Problem Statement
Clear articulation of the problem

## Forces / Requirements
Constraints and requirements influencing the decision

## Decision
What is the change that we're proposing or doing?

## Implementation Strategy
How will this be implemented?

## Consequences
What becomes easier or more difficult?

## Alternatives Considered
What other options did we consider?

## Success Metrics
How do we know this decision was correct?

## Follow-Up Actions
What needs to happen next?
```

### Development Journal Format

- **Chronological entries** with clear dates
- **Context before conclusions** - explain the situation that led to decisions
- **Explicit learning capture** - what did we discover?
- **Future intentions** - what are we planning and why?
- **Success criteria** - how will we know we've succeeded?

### Diagram Standards

- **Mermaid syntax** for consistency and GitHub integration
- **Clear labels** and consistent terminology
- **Domain-configurable elements** using template variables where applicable
- **Version control friendly** (text-based, not binary images)

## Documentation Values

### For AI Assistants

- **Rich Context** - Provide enough background for AI to understand decisions
- **Explicit Rationale** - Don't just document what, document why
- **Change History** - Capture evolution of thinking and decisions
- **Template Patterns** - Establish consistent approaches for similar decisions

### For Human Developers

- **Self-Documenting** - Project should explain itself through documentation
- **Decision Traceability** - Understand why things are the way they are
- **Onboarding Friendly** - New developers can understand project quickly
- **Evolution Transparent** - See how project thinking has changed over time

### For Template Users

- **Production Ready** - Documentation supports real-world usage
- **Complete Workflows** - All necessary steps documented clearly
- **Troubleshooting Support** - Common issues and solutions provided
- **Customization Guidance** - How to adapt template for specific needs

## Maintenance and Evolution

### Weekly Reviews

- Update development journal with progress and learnings
- Review ADR statuses and update if superseded
- Ensure documentation matches current implementation

### Before Major Changes

- Create or update relevant ADRs
- Update integration strategy documents
- Consider impact on template users

### After Major Milestones

- Capture lessons learned in development journal
- Update architectural diagrams
- Review and refine documentation standards

## Tools and Integration

### Viewing Documentation

- **GitHub** - ADRs and documentation render natively
- **Mermaid Live Editor** - For diagram editing and visualization
- **VS Code** - Mermaid extension for local diagram editing

### Validation

- **Markdown linting** - Consistent formatting across all documentation
- **Link checking** - Ensure internal references remain valid
- **Template variable consistency** - Verify placeholder usage aligns

## Documentation Anti-Patterns

**Avoid:**

- Documentation that becomes outdated immediately after writing
- Over-documentation of trivial decisions
- Documentation that just repeats what code already says clearly
- Binary artifacts that can't be version controlled effectively

**Prefer:**

- Documentation that captures decision context and rationale
- Living documents that evolve with understanding
- Clear separation between template documentation and user documentation
- Text-based artifacts that integrate well with version control

---

This documentation approach has been refined through the SonicJS integration pivot and hostname consolidation process, proving the value of intention-before-action and systematic documentation practices.
