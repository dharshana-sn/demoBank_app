const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = withAppBuildGradle(config => {
  if (!config.modResults?.contents) return config;

  let contents = config.modResults.contents;

  // RN 0.71+ template uses findProperty check
  contents = contents.replace(
    /enable\s*\(findProperty\(["']reactNativeArchitectures["']\)\s*!=\s*null\)/g,
    'enable false'
  );

  // RN <0.71 template uses a boolean variable
  contents = contents.replace(
    /def enableSeparateBuildPerCPUArchitecture\s*=\s*true/g,
    'def enableSeparateBuildPerCPUArchitecture = false'
  );

  config.modResults.contents = contents;
  return config;
});
