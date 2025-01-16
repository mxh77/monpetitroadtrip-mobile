export default ({ config }) => ({
  ...config,
  name: "monpetitroadtrip",
  slug: "monpetitroadtrip",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/logo_icone_monpetitroadtrip.png",
  userInterfaceStyle: "light",
  newArchEnabled: false, // Activez la nouvelle architecture si nécessaire
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  android: {
    config: {
      googleMaps: {
        apiKey: "AIzaSyBYC-Mamm9LrqrbBPR7jcZ1ZnnwWiRIXQw"
      }
    },
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.maxime.heron.monpetitroadtrip",
    permissions: [
      "INTERNET", // Nécessaire pour Google Maps et API Places
      "ACCESS_FINE_LOCATION", // Permission de localisation si nécessaire
      "ACCESS_COARSE_LOCATION",
    ]

  },
  web: {
    favicon: "./assets/favicon.png",
  }
});
