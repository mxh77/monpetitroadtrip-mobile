import 'dotenv/config';

console.log("Clé API chargée :", process.env.GOOGLE_API_KEY);

export default ({ config }) => ({
  ...config,
  name: "monpetitroadtrip",
  slug: "monpetitroadtrip",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
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
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY, // Ajoute la clé depuis le fichier .env
  },
});
