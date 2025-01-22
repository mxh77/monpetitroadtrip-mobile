import 'dotenv/config';

export default ({ config }) => {
  const buildType = process.env.BUILD_TYPE || "debug";
  console.log(`Building with BUILD_TYPE: ${buildType}`);
  const isProduction = buildType === "release";
  
  return {
    ...config,
    name: isProduction ? "Mon Petit Roadtrip" : "MPR", // Nom de l'application
    slug: isProduction ? "mon-petit-roadtrip" : "mpr", // Slug pour Expo
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo_sans_texte.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
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
        foregroundImage: "./assets/logo_sans_texte.png",
        backgroundColor: "#ffffff",
      },
      package: isProduction
      ? "com.maxime.heron.monpetitroadtrip"
      : "com.maxime.heron.monpetitroadtrip.debug",
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
  };
};
