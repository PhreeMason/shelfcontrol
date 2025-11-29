#!/bin/bash
# Security Check Script for ShelfControl
# Checks for known compromised packages from supply chain attacks
# Run: ./scripts/security-check.sh
# Exit codes: 0 = safe, 1 = security issue detected

set -e

echo "========================================"
echo "  ShelfControl Security Check"
echo "========================================"
echo ""

ERRORS=0

# --- PostHog Version Check ---
echo "Checking PostHog version..."

POSTHOG_VERSION=$(npm list posthog-react-native 2>/dev/null | grep posthog-react-native | head -1 | sed 's/.*@//')

# Known compromised PostHog versions
COMPROMISED_POSTHOG=("4.11.1" "4.12.5")

for version in "${COMPROMISED_POSTHOG[@]}"; do
  if [[ "$POSTHOG_VERSION" == "$version" ]]; then
    echo "  CRITICAL: Compromised PostHog version detected: $POSTHOG_VERSION"
    ERRORS=1
  fi
done

if [[ $ERRORS -eq 0 ]]; then
  echo "  posthog-react-native@$POSTHOG_VERSION (safe)"
fi

# Check @posthog/core if installed
CORE_VERSION=$(npm list @posthog/core 2>/dev/null | grep "@posthog/core" | head -1 | sed 's/.*@//' || echo "not installed")
if [[ "$CORE_VERSION" == "1.5.6" ]]; then
  echo "  CRITICAL: Compromised @posthog/core version detected: $CORE_VERSION"
  ERRORS=1
elif [[ "$CORE_VERSION" != "not installed" ]]; then
  echo "  @posthog/core@$CORE_VERSION (safe)"
fi

echo ""

# --- Malicious File Check ---
echo "Scanning for malicious files..."

MALICIOUS_FILES=$(find . \( -name "setup_bun.js" -o -name "bun_environment.js" -o -name "truffleSecrets.json" -o -name "cloud.json" -o -name "environment.json" \) -not -path "./.git/*" 2>/dev/null || true)

# Filter out legitimate Contents.json (iOS assets)
MALICIOUS_FILES=$(echo "$MALICIOUS_FILES" | grep -v "Contents.json" || true)

if [[ -n "$MALICIOUS_FILES" ]]; then
  echo "  CRITICAL: Malicious files found:"
  echo "$MALICIOUS_FILES" | while read -r file; do
    echo "    - $file"
  done
  ERRORS=1
else
  echo "  No malicious files found"
fi

echo ""

# --- npm audit ---
echo "Running npm audit..."

AUDIT_OUTPUT=$(npm audit --audit-level=high 2>&1 || true)
AUDIT_EXIT=$?

if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
  echo "  0 vulnerabilities found"
elif echo "$AUDIT_OUTPUT" | grep -q "high\|critical"; then
  echo "  WARNING: High/critical vulnerabilities found"
  echo "$AUDIT_OUTPUT" | grep -E "(high|critical)" | head -5
  ERRORS=1
else
  echo "  npm audit passed"
fi

echo ""

# --- Package.json pinning check ---
echo "Checking version pinning..."

if grep -q '"posthog-react-native": "4.10.1"' package.json; then
  echo "  PostHog is pinned to exact version (no ^ or ~)"
elif grep -q '"posthog-react-native": "\^' package.json; then
  echo "  WARNING: PostHog uses caret (^) - consider exact pinning"
elif grep -q '"posthog-react-native": "~' package.json; then
  echo "  WARNING: PostHog uses tilde (~) - consider exact pinning"
else
  echo "  PostHog version pinning: unknown format"
fi

echo ""

# --- Summary ---
echo "========================================"
if [[ $ERRORS -eq 0 ]]; then
  echo "  All security checks PASSED"
  echo "========================================"
  exit 0
else
  echo "  Security issues DETECTED"
  echo "  Review SECURITY.md for remediation steps"
  echo "========================================"
  exit 1
fi
