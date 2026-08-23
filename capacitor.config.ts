import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hallowok.app',
  appName: 'Hallo Wok',
  webDir: 'dist',
  server: {
    // The development backend serves files over HTTP on the LAN. Using the
    // same scheme prevents Android WebView from blocking those images as mixed content.
    androidScheme: 'http',
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
