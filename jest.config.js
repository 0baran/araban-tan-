module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-bluetooth-classic|@react-native-async-storage)/)',
  ],
};
