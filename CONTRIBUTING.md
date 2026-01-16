# Contributing to Klassroom

## Development Setup

This project is a monorepo managed by [pnpm](https://pnpm.io/).

### Prerequisites

- Node.js >= 22
- pnpm

### Installation

```bash
pnpm install
```

### Building

To build all packages:

```bash
pnpm build
```

### Linting & Formatting

This project uses [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/).

To lint the code:

```bash
pnpm lint
```

To format the code:

```bash
pnpm format
```

### Pre-commit Hooks

This project uses [husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged) to run linting and formatting on staged files before each commit.

Hooks are installed automatically when you run `pnpm install`. If you need to bypass the hooks for a specific commit:

```bash
git commit --no-verify -m "your message"
```

To clean build artifacts:

```bash
pnpm run clean
```

### Testing

Run the test suite with Vitest:

```bash
pnpm test
```

## Project Structure

- **`packages/core`**: The core logic (parsing, analytics, charts, HTML generation).
- **`packages/cli`**: The command-line interface wrapper.
- **`packages/web`**: The web application (browser-based UI with PWA support).

## Workflow

1.  Make changes in the relevant package.
2.  Run `pnpm build` to compile TypeScript.
3.  Run `pnpm test` to verify changes.

## Versioning

This project uses [release-please](https://github.com/googleapis/release-please) for automated versioning and changelog generation. All packages share the same version.

### How it works

1. Use [conventional commits](https://www.conventionalcommits.org/) when merging PRs:
   - `feat:` or `feat(scope):` for new features (bumps minor version)
   - `fix:` or `fix(scope):` for bug fixes (bumps patch version)
   - `feat!:` or `fix!:` for breaking changes (bumps major version)
   - `docs:`, `chore:`, `ci:` for non-release changes

2. When changes are merged to `main`, release-please automatically opens/updates a Release PR with:
   - Version bumps across all packages
   - Auto-generated CHANGELOG.md

3. Merge the Release PR when ready to cut a release.

No labels, no manual version edits required.
