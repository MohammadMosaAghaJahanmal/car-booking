const base = require('./app.json');
module.exports = () => {
  const commonMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const androidMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY || commonMapsKey;
  const iosMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY || commonMapsKey;
  const plugins = base.expo.plugins.filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== 'react-native-maps';
  });
  if (androidMapsKey || iosMapsKey) {
    plugins.push(['react-native-maps', {
      androidGoogleMapsApiKey: androidMapsKey,
      iosGoogleMapsApiKey: iosMapsKey,
    }]);
  }
  return { ...base.expo, plugins };
};
