#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function syncVersion() {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;

    if (!version) {
      console.error('No version found in package.json');
      process.exit(1);
    }

    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    if (!appJson.expo) {
      appJson.expo = {};
    }
    if (!appJson.expo.ios) {
      appJson.expo.ios = {};
    }
    if (!appJson.expo.android) {
      appJson.expo.android = {};
    }

    // Track current build numbers
    const currentBuildNumber = appJson.expo.ios.buildNumber;
    const currentVersionCode = appJson.expo.android.versionCode;

    // Sync version
    appJson.expo.version = version;

    // Auto-increment build numbers
    const newBuildNumber = (parseInt(currentBuildNumber || '0', 10) + 1).toString();
    const newVersionCode = (currentVersionCode || 0) + 1;

    appJson.expo.ios.buildNumber = newBuildNumber;
    appJson.expo.android.versionCode = newVersionCode;

    // Write updated app.json
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

    // Print summary
    console.log('✅ Version synced:', version);
    console.log(`✅ iOS buildNumber: ${currentBuildNumber} → ${newBuildNumber}`);
    console.log(`✅ Android versionCode: ${currentVersionCode} → ${newVersionCode}`);
    console.log('📝 Updated app.json');

    return true;
  } catch (error) {
    console.error('Error syncing version:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  syncVersion();
}

module.exports = { syncVersion };