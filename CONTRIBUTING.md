# Contributing to Sherp

Thank you for your interest in contributing to Sherp! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm (comes with Node.js)

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sherp.git
   cd sherp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Project Structure

This is a monorepo containing two packages:

```
sherp/
├── packages/
│   ├── cli/      # @skeptrunedev/sherp-cli - Command line interface
│   └── astro/    # @skeptrunedev/sherp-astro - Astro-based presentation engine
├── assets/       # Static assets and theme previews
└── package.json  # Root workspace configuration
```

## Development Workflow

### Working on Packages

Navigate to the specific package you want to work on:

```bash
# For CLI development
cd packages/cli

# For Astro engine development
cd packages/astro
```

### Code Style

We use Prettier for code formatting. Before submitting a PR, ensure your code is formatted:

```bash
# Check formatting
npm run format

# Auto-fix formatting issues
npm run format:fix
```

## Making Contributions

### Reporting Bugs

Before creating a bug report, please check if the issue already exists. When creating a bug report, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (OS, Node.js version, npm version)
- Any relevant error messages or screenshots

### Suggesting Features

Feature requests are welcome! Please include:

- A clear description of the feature
- The problem it solves or use case it addresses
- Any implementation ideas you have

### Pull Requests

1. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them with clear, descriptive messages:
   ```bash
   git commit -m "Add feature: description of what you added"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a Pull Request against the `main` branch

### PR Guidelines

- Keep PRs focused on a single change
- Include tests for new functionality when applicable
- Update documentation if needed
- Ensure all existing tests pass
- Follow the existing code style

## Areas for Contribution

Here are some areas where contributions are especially welcome:

- **New Themes**: Create additional built-in themes
- **Documentation**: Improve docs, add examples, fix typos
- **Bug Fixes**: Help squash bugs
- **Features**: Implement new features from the roadmap
- **Testing**: Add test coverage

## Code of Conduct

Please note that this project has a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Questions?

If you have questions, feel free to:

- Open an issue for discussion
- Check existing issues and discussions

## License

By contributing to Sherp, you agree that your contributions will be licensed under the MIT License.
