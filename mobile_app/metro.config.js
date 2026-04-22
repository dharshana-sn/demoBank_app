const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force polling on Windows so Metro detects file changes reliably
config.watchFolders = [__dirname];
config.watcher = {
    watchman: {
        deferStates: ['hg.update'],
    },
    // Use polling as fallback when file system events are unreliable (Windows)
    additionalExts: ['mjs', 'cjs'],
};

module.exports = config;
