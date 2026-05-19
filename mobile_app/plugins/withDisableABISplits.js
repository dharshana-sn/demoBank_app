const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = withAppBuildGradle(config => {
  config.modResults.contents = config.modResults.contents
    .replace(
      'def enableSeparateBuildPerCPUArchitecture = true',
      'def enableSeparateBuildPerCPUArchitecture = false'
    )
    .replace(
      'enableSeparateBuildPerCPUArchitecture = true',
      'enableSeparateBuildPerCPUArchitecture = false'
    );
  return config;
});
