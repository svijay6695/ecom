import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vpnuts.app',
  appName: 'VP Nuts',
  webDir: 'public',
  server: {
    url: 'https://vpnuts.vercel.app',
    cleartext: true,
    allowNavigation: [
      'vpnuts.vercel.app',
      '*.vercel.app',
      'ecom-xpht.onrender.com',
      '*.razorpay.com',
      'api.razorpay.com',
      'checkout.razorpay.com',
      '*.firebaseapp.com',
      '*.googleapis.com'
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;

