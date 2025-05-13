# Version Management for PromptBox

This document outlines how version numbers are managed in the PromptBox application.

## Version Format

PromptBox follows [Semantic Versioning](https://semver.org/) (SemVer) with the format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Incremented for incompatible API changes
- **MINOR**: Incremented for new features in a backward-compatible manner
- **PATCH**: Incremented for backward-compatible bug fixes

## How Version is Used

- The version number is stored in `package.json`
- The application reads this version from main.js via `import.meta.env.PACKAGE_VERSION`
- The version is displayed in the Settings page under App Information

## Updating the Version

### Manual Update

You can manually edit the version in `package.json`:

```json
{
  "version": "1.0.0"
}
```

### Using npm Commands

```bash
# Patch increment (1.0.0 → 1.0.1)
npm version patch

# Minor increment (1.0.0 → 1.1.0)
npm version minor

# Major increment (1.0.0 → 2.0.0)
npm version major
```

### Using standard-version (Recommended)

We've integrated `standard-version` for automated version management:

```bash
# Release with automatic version increment based on commits
npm run release

# Specify version type
npm run release -- --release-as minor
npm run release -- --release-as major
npm run release -- --release-as patch
```

## Commit Message Guidelines

To automate versioning effectively, follow these commit message conventions:

- `fix:` - A bug fix (corresponds to PATCH)
- `feat:` - A new feature (corresponds to MINOR)
- `BREAKING CHANGE:` - Incompatible API changes (corresponds to MAJOR)

Examples:
```
fix: resolve update notification not showing
feat: add ability to export templates
feat: support new model types
BREAKING CHANGE: new authentication system
```

## Release Process

1. Make your changes and commit with conventional commit messages
2. Run `npm run release` to:
   - Update the version in package.json
   - Generate/update CHANGELOG.md
   - Commit the version changes
   - Tag the release
3. Push the changes and tags: `git push --follow-tags origin main`
4. Build and deploy your application