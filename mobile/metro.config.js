const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// watchFolders intentionally not set - watching parent dir crashes Windows file watcher

config.resolver.sourceExts.push('mjs');

module.exports = config;
