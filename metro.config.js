const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Enable tree shaking and other optimizations
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

// Add video file extensions to asset extensions
config.resolver.assetExts.push('mov', 'MOV', 'mp4', 'MP4', 'avi', 'wmv', 'flv', 'webm');

module.exports = withNativeWind(config, { input: './global.css' })