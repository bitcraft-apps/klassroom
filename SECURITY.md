# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| < 0.2   | :x:                |

Only the current stable version receives security updates.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Use GitHub's private vulnerability reporting:

1. Go to [Security Advisories](https://github.com/bitcraft-apps/klassroom/security/advisories)
2. Click "Report a vulnerability"
3. Fill in the details

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- **For GDPR-related issues**: Explicitly flag if the vulnerability could expose student data

## Response Timeline

These are non-binding targets for a small team:

- **Acknowledgment**: Within 7 days
- **Assessment**: Within 14 days

## Scope

The following are in scope for security reports:

- `@klassroom/core`
- `@klassroom/cli`
- `@klassroom/web`
- https://klassroom.graczyk.dev

## GDPR Considerations

This tool processes student grade data from Polish schools. By design:

- Student names are parsed but **never appear in output**
- Generated presentations use student numbers only
- All processing happens locally (browser or CLI)

**GDPR-related vulnerabilities are treated as high priority.** If you discover a way student names could leak into output, please report it immediately.
