import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Dimensions } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import MapView, { Marker, LatLng, Region } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import Icon from 'react-native-vector-icons/FontAwesome';
import Constants from 'expo-constants';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_API_KEY;
console.log("Clé API dans l'application :", GOOGLE_API_KEY);

type RootStackParamList = {
    Home: undefined;
    Login: undefined;
    RoadTrips: undefined;
    RoadTripStack: { roadtripId: string };
    Stage: { stageId: string; stageTitle: string; stageAddress: string; stageCoordinates?: { latitude: number; longitude: number }; accommodations?: { address: string; coordinates?: { latitude: number; longitude: number } }[]; activities?: { address: string; coordinates?: { latitude: number; longitude: number } }[] };
};

type Props = StackScreenProps<RootStackParamList, 'Stage'>;

export default function StageScreen({ route, navigation }: Props) {
    const { stageTitle, stageAddress, stageCoordinates, accommodations = [], activities = [] } = route.params;
    const [loading, setLoading] = useState(true);
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(stageCoordinates || null);
    const [markers, setMarkers] = useState<{ latitude: number; longitude: number; title: string; type: string }[]>([]);
    const [hasFetched, setHasFetched] = useState(false);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        if (hasFetched) return;

        console.log('Accommodations:', accommodations);
        console.log('Activities:', activities);

        // Initialiser le géocodeur avec votre clé API Google Maps
        Geocoder.init(GOOGLE_API_KEY);

        // Fonction pour géocoder une adresse
        const geocodeAddress = async (address: string) => {
            try {
                const json = await Geocoder.from(address);
                if (json.results.length > 0) {
                    const location = json.results[0].geometry.location;
                    return { latitude: location.lat, longitude: location.lng };
                } else {
                    console.error('Erreur : aucune coordonnée trouvée pour cette adresse.');
                    return null;
                }
            } catch (error) {
                console.error('Erreur lors du géocodage:', error);
                return null;
            }
        };

        // Géocoder l'adresse du stage si les coordonnées ne sont pas disponibles
        const fetchCoordinates = async () => {
            try {
                if (!coordinates) {
                    console.log('Géocodage de l\'adresse du stage...');
                    const stageCoords = await geocodeAddress(stageAddress);
                    if (stageCoords) {
                        setCoordinates(stageCoords);
                        console.log('Coordonnées du stage:', stageCoords);
                    }
                }

                // Géocoder les adresses des hébergements
                console.log('Géocodage des adresses des hébergements...');
                const accommodationMarkers = await Promise.all(
                    accommodations.map(async (accommodation) => {
                        const coords = accommodation.coordinates || await geocodeAddress(accommodation.address);
                        if (coords) {
                            console.log('Coordonnées de l\'hébergement:', coords);
                            return { ...coords, title: 'Hébergement', type: 'bed' };
                        }
                        return null;
                    })
                );

                // Géocoder les adresses des activités
                console.log('Géocodage des adresses des activités...');
                const activityMarkers = await Promise.all(
                    activities.map(async (activity) => {
                        const coords = activity.coordinates || await geocodeAddress(activity.address);
                        if (coords) {
                            console.log('Coordonnées de l\'activité:', coords);
                            return { ...coords, title: 'Activité', type: 'flag' };
                        }
                        return null;
                    })
                );

                // Filtrer les marqueurs valides et les ajouter à l'état
                const validMarkers = [
                    ...accommodationMarkers.filter(marker => marker !== null),
                    ...activityMarkers.filter(marker => marker !== null),
                ];

                setMarkers(validMarkers);

                // Ajuster automatiquement le zoom de la carte pour afficher tous les marqueurs
                if (mapRef.current && validMarkers.length > 0) {
                    const coordinates = validMarkers.map(marker => ({ latitude: marker.latitude, longitude: marker.longitude }));
                    mapRef.current.fitToCoordinates(coordinates, {
                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                        animated: true,
                    });
                }

                setLoading(false);
                setHasFetched(true);
            } catch (error) {
                console.error('Erreur lors de la récupération des coordonnées:', error);
                setLoading(false);
            }
        };

        fetchCoordinates();
    }, [stageAddress, accommodations, activities, coordinates, hasFetched]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    if (!coordinates) {
        return (
            <View style={styles.container}>
                <Text>Erreur : impossible de récupérer les coordonnées de l'adresse.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{stageTitle}</Text>
                {/* Ajoutez ici le contenu supplémentaire que vous souhaitez afficher sous la carte */}
            </View>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                <Marker
                    coordinate={coordinates}
                    title={stageTitle}
                />
                {markers.map((marker, index) => (
                    <Marker
                        key={index}
                        coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                        title={marker.title}
                    >
                        <Icon name={marker.type} size={30} color="#007BFF" />
                    </Marker>
                ))}
            </MapView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height / 3,
    },
    content: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 16,
    },
});