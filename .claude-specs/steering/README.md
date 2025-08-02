# Kiro Steering Documents

This directory contains foundational steering documents that provide persistent knowledge about the HOME-DRUG CONNECT project. These documents guide AI interactions to ensure consistency and alignment with project standards throughout spec-driven development.

## Purpose

Steering documents serve as the "north star" for AI assistants, providing essential context that should be considered in every interaction. They ensure that generated code, documentation, and specifications align with established patterns and decisions.

## Core Documents

### 1. **product.md** - Product Overview
Defines what the product is, who it serves, and why it exists. This helps AI understand the business context behind technical decisions.

**Key Sections:**
- Product overview and mission
- Core features for each user type
- Target use cases and scenarios
- Value proposition and competitive advantages
- Business model and success metrics

### 2. **tech.md** - Technology Stack
Documents all technology choices, development environment setup, and deployment configurations. This ensures AI suggests solutions using established technologies.

**Key Sections:**
- System architecture overview
- Frontend and backend technology choices
- Development environment and tools
- Common commands and workflows
- Environment variables and configuration
- Build and deployment processes

### 3. **structure.md** - Project Structure
Outlines how the codebase is organized, naming conventions, and architectural patterns. This helps AI generate code that fits seamlessly into the existing structure.

**Key Sections:**
- Directory organization
- Code patterns and conventions
- File naming standards
- Import organization rules
- Key architectural principles
- Development patterns

## Usage in Spec-Driven Development

These steering documents are automatically loaded during AI interactions to:

1. **Inform Specifications**: When creating new specs, AI references these documents to ensure alignment
2. **Guide Implementation**: During coding, patterns and conventions are followed automatically
3. **Maintain Consistency**: All generated code follows established standards
4. **Reduce Repetition**: Common questions are answered by referencing steering docs

## Maintenance

Steering documents should be updated when:
- Major architectural decisions change
- New technologies are adopted
- Significant patterns emerge
- Business model or product direction shifts

Use the `/steering-update` command to refresh steering documents after significant changes.

## Custom Steering

Additional steering documents can be created for specialized contexts:
- `api-standards.md` - API design patterns
- `testing-approach.md` - Testing strategies
- `security-policies.md` - Security requirements
- `performance-standards.md` - Performance targets

These can be configured for conditional loading based on file patterns or manual inclusion.