#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/release.sh <patch|minor|major>
# Bumps version, commits, pushes. CI handles npm publish + git tag.

BUMP="${1:?Usage: release.sh <patch|minor|major>}"

# Validate bump type
if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Error: bump type must be patch, minor, or major" >&2
  exit 1
fi

# Ensure clean working tree
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

# Bump version (npm version without git tag — CI creates the tag)
NEW_VERSION=$(npm version "$BUMP" --no-git-tag-version)
echo "Bumped to $NEW_VERSION"

# Commit and push
git add package.json
git commit -m "chore(release): $NEW_VERSION"
git push

echo "Pushed chore(release): $NEW_VERSION — CI will publish to npm"
