# Claude Specs Steering Documents

This directory contains foundational steering documents that provide persistent project knowledge for AI interactions. These documents are automatically included in every Claude Code session to ensure consistent and aligned assistance.

## Documents

### 📋 product.md
Comprehensive product overview including:
- Product description and vision
- Core features and capabilities
- Target users and use cases
- Key value propositions

### 🛠 tech.md
Complete technology landscape:
- System architecture
- Frontend and backend stack
- Development environment setup
- Common commands and configurations
- API endpoints and performance targets

### 📁 structure.md
Codebase organization guide:
- Directory structure and purpose
- Code organization patterns
- Naming conventions
- Import standards
- Architectural principles

## Usage

These documents are automatically loaded into Claude Code's context at the start of each session. They ensure that:

1. **Consistency**: All generated code follows established patterns
2. **Context**: AI understands the product's purpose and constraints
3. **Efficiency**: No need to repeatedly explain project basics
4. **Quality**: Suggestions align with architectural decisions

## Maintenance

Update these documents when:
- Major architectural changes occur
- New technologies are adopted
- Core patterns or conventions change
- Product direction shifts

Use the `/steering-update` command to refresh these documents based on current codebase state.

## Custom Steering

For specialized contexts, create additional steering documents:
- API documentation
- Testing strategies
- Security policies
- Performance guidelines

Place custom steering files in this directory and they'll be automatically included.
EOF < /dev/null