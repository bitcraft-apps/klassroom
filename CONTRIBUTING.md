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

This project uses synchronized versioning across all packages. Every PR must have exactly one release label:

| Label           | When to use                                 |
| --------------- | ------------------------------------------- |
| `release:patch` | Bug fixes, documentation updates            |
| `release:minor` | New features, non-breaking changes          |
| `release:major` | Breaking changes                            |
| `no-release`    | CI changes, refactoring with no user impact |

For PRs with `release:patch`, `release:minor`, or `release:major`:

1. Update the version in root `package.json`
2. Update all `packages/*/package.json` to the same version
3. Versions must follow [semver](https://semver.org/)

The CI workflow validates label presence and version synchronization. Bot PRs (Dependabot, Renovate) are exempt from this check.
