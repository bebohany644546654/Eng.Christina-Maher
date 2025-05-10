import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.physicsedu.app',
  appName: 'Physics Education',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#171E31",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#D4AF37",
      sound: "notification.wav",
    },
    CapacitorHttp: {
      enabled: true
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      signingType: undefined
    },
    permissions: [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.MANAGE_DOCUMENTS",
      "android.permission.DOWNLOAD_WITHOUT_NOTIFICATION"
    ]
  },
  ios: {
    contentInset: "always",
    scheme: "PhysicsEducation",
    backgroundColor: "#171E31",
    permissions: {
      camera: {
        text: "نحتاج الوصول للكاميرا لتسجيل الحضور عبر QR code"
      },
      photos: {
        text: "نحتاج الوصول للصور لرفع الملفات والمستندات"
      }
    }
  }
};

export default config;
