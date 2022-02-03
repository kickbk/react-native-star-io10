const {
  withProjectBuildGradle,
  withPlugins,
  withInfoPlist,
  AndroidConfig,
} = require("@expo/config-plugins");

const BLUETOOTH_ALWAYS =
  "Allow $(PRODUCT_NAME) to connect to bluetooth devices";
const LOCAL_NETWORK_USAGE =
  "Allow $(PRODUCT_NAME) to discover devices on the network";

function setMinSdkVersion(buildGradle, minVersion) {
  const regexpMinSdkVersion = /\bminSdkVersion\s*=\s*(\d+)/;
  const match = buildGradle.match(regexpMinSdkVersion);

  if (match) {
    const version = parseInt(match[1], 10);

    if (version < minVersion) {
      buildGradle = buildGradle.replace(
        /\bminSdkVersion\s*=\s*\d+/,
        `minSdkVersion = ${minVersion}`
      );
    } else {
      console.warn(`WARN: minSdkVersion is already >= ${version}`);
    }
  }

  return buildGradle;
}

const withIosPermissions = (
  c,
  { bluetoothAlwaysPermission, localNetworkUsagePermission } = {}
) => {
  return withInfoPlist(c, (config) => {
    if (bluetoothAlwaysPermission !== false) {
      config.modResults.NSBluetoothAlwaysUsageDescription =
        bluetoothAlwaysPermission ||
        config.modResults.NSBluetoothAlwaysUsageDescription ||
        BLUETOOTH_ALWAYS;
    }
    if (localNetworkUsagePermission !== false) {
      config.modResults.NSLocalNetworkUsageDescription =
        localNetworkUsagePermission ||
        config.modResults.NSLocalNetworkUsageDescription ||
        LOCAL_NETWORK_USAGE;
    }
    return config;
  });
};

const withAccessoryProtocols = (c, props) => {
  return withInfoPlist(c, (config) => {
    const existingProtocols = config.modResults.NSBluetoothProtocols || [];
    config.modResults.UISupportedExternalAccessoryProtocols = [
      ...existingProtocols,
      "jp.star-m.starpro",
    ];

    return config;
  });
};

const withMinSdkVersion = (config, { minSdkVersion } = {}) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = setMinSdkVersion(
        config.modResults.contents,
        minSdkVersion || 23
      );
    } else {
      throw new Error(
        "Can't set minSdkVersion in the project build.gradle, because it's not groovy"
      );
    }
    return config;
  });
};

const withAndroidPermissions = (config, props) => {
  config = AndroidConfig.Permissions.withPermissions(config, [
    "android.permission.BLUETOOTH_CONNECT ",
  ]);

  return config;
};

module.exports = (config, props) =>
  withPlugins(config, [
    [withMinSdkVersion, props],
    [withIosPermissions, props],
    [withAccessoryProtocols, props],
    [withAndroidPermissions, props],
  ]);