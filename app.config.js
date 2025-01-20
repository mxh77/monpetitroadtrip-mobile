import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "monpetitroadtrip",
  slug: "monpetitroadtrip",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/logo192.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/logo.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  android: {
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_API_KEY,
      },
    },
    adaptiveIcon: {
      foregroundImage: "./assets/logo192.png",
      backgroundColor: "#ffffff",
    },
    package: "com.maxime.heron.monpetitroadtrip",
    permissions: [
      "INTERNET",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    apiKey: process.env.GOOGLE_API_KEY, // Ajout de la clé API ici
    eas: {
      projectId: "547f7eb3-324d-4060-91c6-924ef3f69de8", // Ajoutez ici l’identifiant du projet
    },
  },
});
