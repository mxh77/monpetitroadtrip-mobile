import { Linking } from 'react-native';

export const openInGoogleMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
};

export const openWebsite = (url: string) => {
    Linking.openURL(url);
};