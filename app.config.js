import 'dotenv/config';

//console.log("Clé API chargée :", process.env.GOOGLE_API_KEY);

export default ({ config }) => ({
  ...config,
  name: "monpetitroadtrip",
  slug: "monpetitroadtrip",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/logo_icone_monpetitroadtrip.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.maxime.heron.monpetitroadtrip", // Ajoutez cette ligne avec votre identifiant unique
    permissions: ["INTERNET"], // Ajoutez cette ligne
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_API_KEY
      }
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    API_URL: process.env.API_URL,
    eas: {
      projectId: "547f7eb3-324d-4060-91c6-924ef3f69de8"
    }
  },
});
