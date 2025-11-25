# Security Guidelines

This document outlines security practices and verification procedures for the ShelfControl project.

## PostHog Supply Chain Attack Response (Nov 24, 2024)

### Background

On November 24, 2024, PostHog was affected by the Shai-Hulud supply chain attack, which compromised several versions of their JavaScript SDKs during a 5-hour window (4:11 AM - 9:30 AM UTC).

**Compromised versions:**
- `posthog-react-native@4.11.1` ❌
- `posthog-react-native-session-replay@1.2.2` ❌
- `posthog-js@1.297.3`
- `posthog-node@4.18.1`, `5.13.3`, `5.11.3`
- `@posthog/agent@1.24.1`
- `@posthog/ai@7.1.2`
- `@posthog/cli@0.5.15`

### Our Project Status

✅ **SAFE** - ShelfControl uses `posthog-react-native@4.10.1` (pinned to exact version as of Nov 25, 2024)

**Actions taken:**
- Pinned PostHog to exact version `4.10.1` in `package.json` (removed caret `^`)
- Verified `package-lock.json` locks to safe version
- Scanned for malicious files (none found)
- Optional peer dependency `posthog-react-native-session-replay` is not installed

## Security Verification Commands

### Check for Malicious Files

Run these commands before installing dependencies on a new machine:

```bash
# Search for known malicious files from Shai-Hulud attack
find . -name "setup_bun.js" \
  -o -name "bun_environment.js" \
  -o -name "cloud.json" \
  -o -name "contents.json" \
  -o -name "environment.json" \
  -o -name "truffleSecrets.json"
```

Expected result: No files found (legitimate `Contents.json` files in iOS assets are safe)

### Verify PostHog Version

```bash
# Check package.json has pinned version (no ^ or ~)
grep "posthog-react-native" package.json
# Expected: "posthog-react-native": "4.10.1"

# Check locked version in package-lock.json
grep -A3 '"node_modules/posthog-react-native"' package-lock.json | grep version
# Expected: "version": "4.10.1"

# After installation, verify installed version
npm list posthog-react-native
# Expected: posthog-react-native@4.10.1
```

### Check NPM Logs for Suspicious Activity

```bash
# Search for attack indicators in npm logs
grep -R "shai" ~/.npm/_logs 2>/dev/null
grep -R "preinstall" ~/.npm/_logs 2>/dev/null
```

### Verify No Suspicious Network Calls in node_modules

```bash
# After installation, scan for attack indicators
grep -r "trufflesecurity\|bun\.sh\|setup_bun" node_modules/ 2>/dev/null
```

Expected result: No matches found

## Safe Installation Procedure

### For Clean Installation

```bash
# 1. Verify package.json has pinned version
cat package.json | grep posthog-react-native
# Should show: "posthog-react-native": "4.10.1" (no caret)

# 2. Install from lock file (recommended)
npm ci

# 3. Verify installed version
npm list posthog-react-native

# 4. Run malicious file check
find node_modules/posthog-react-native -name "setup_bun.js" -o -name "bun_environment.js"
# Should return: nothing
```

### For Existing Installation

```bash
# 1. Clean existing installation
rm -rf node_modules
npm cache clean --force

# 2. Verify package.json and package-lock.json have safe versions
grep "posthog-react-native" package.json package-lock.json

# 3. Reinstall from lock file
npm ci

# 4. Verify installation
npm list posthog-react-native
```

## Dependency Update Policy

### PostHog Updates

**Current policy:** Exact version pinning (`4.10.1`)

**Before updating PostHog:**

1. Check PostHog security advisories: https://github.com/PostHog/posthog-js/security
2. Verify new version is confirmed safe by PostHog team
3. Review release notes for security-related changes
4. Update to specific version (maintain exact pinning, no `^` or `~`)
5. Run security verification commands after update

### General Dependency Updates

```bash
# Check for security vulnerabilities
npm audit

# Fix security issues (review changes first)
npm audit fix

# For major security issues
npm audit fix --force
# WARNING: May cause breaking changes, test thoroughly
```

## Security Monitoring

### Regular Security Checks

Run these commands regularly (recommended: weekly):

```bash
# 1. Check for vulnerabilities
npm audit

# 2. Check for outdated packages with security issues
npm outdated

# 3. Verify PostHog version hasn't changed
npm list posthog-react-native
```

### CI/CD Integration

Add to your CI pipeline (`.github/workflows/security.yml` or similar):

```yaml
- name: Security Audit
  run: npm audit --audit-level=moderate

- name: Verify PostHog Version
  run: |
    npm list posthog-react-native | grep "4.10.1" || exit 1
```

## Incident Response Checklist

If a new supply chain attack is discovered:

- [ ] Check if any project dependencies are affected
- [ ] Verify installed versions in `package-lock.json`
- [ ] Scan for malicious files provided by security advisory
- [ ] Check git history for changes during attack window
- [ ] If affected: clean installation and rescan
- [ ] Document incident and update this file
- [ ] Notify team members

## Additional Security Best Practices

### API Keys and Secrets

- ✅ Store all API keys in `.env` file
- ✅ Never commit `.env` to version control
- ✅ Use different keys for development and production
- ✅ Rotate keys if compromised

### Verify secrets are not committed:

```bash
# Check for PostHog API key in git history
git log -p --all -S "phc_" | grep "phc_"

# Should return: nothing (or only references in .env.example)
```

### Code Review Requirements

- Review all dependency updates
- Check for unexpected files in node_modules after installation
- Verify package-lock.json changes match expected updates

## Resources

- **PostHog Security Advisories**: https://github.com/PostHog/posthog-js/security
- **NPM Security Advisories**: https://www.npmjs.com/advisories
- **Shai-Hulud Attack Details**: https://github.com/PostHog/posthog-js/security (see incident timeline)
- **Project PostHog Config**: `src/lib/posthog.ts`

## Contact

For security concerns, contact: mason@shelfcontrol.app

---

**Last Updated**: November 25, 2024
**Next Review**: December 25, 2024
