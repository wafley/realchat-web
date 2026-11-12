import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hallowok.app',
  appName: 'hallowok',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#fafafa',
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#00000000',
      overlaysWebView: true,
    },
  },
};

export default config;
