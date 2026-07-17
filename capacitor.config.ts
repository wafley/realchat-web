import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hallowok.app',
  appName: 'Hallo Wok',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#09090b',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090b',
      overlaysWebView: true,
    },
  },
};

export default config;
