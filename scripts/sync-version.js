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

    const currentAppVersion = appJson.expo?.version;
    if (currentAppVersion === version) {
      console.log(`Versions already synced: ${version}`);
      return false;
    }

    if (!appJson.expo) {
      appJson.expo = {};
    }
    appJson.expo.version = version;

    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

    console.log(`Version synced: ${currentAppVersion || 'undefined'} -> ${version}`);
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