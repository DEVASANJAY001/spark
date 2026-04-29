const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow shared assets from parent directory (../assets)
config.watchFolders = [require('path').resolve(__dirname, '..')];

config.resolver.sourceExts.push('mjs');

module.exports = config;
