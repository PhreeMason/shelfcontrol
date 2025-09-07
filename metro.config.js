// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add fallbacks for Node core modules used by ws
config.resolver.nodeModulesPaths = ["node_modules"];
config.resolver.extraNodeModules = {
  stream: require.resolve("readable-stream"),
};

module.exports = config;