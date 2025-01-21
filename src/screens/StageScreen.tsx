import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, SimpleStep } from '../../types';
import { TabView } from 'react-native-tab-view';
import Geocoder from 'react-native-geocoding';
import Constants from 'expo-constants';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';

type Props = StackScreenProps<RootStackParamList, 'Stage'>;

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';
Geocoder.init(GOOGLE_API_KEY);

export default function StageScreen({ route, navigation }: Props) {
    // États
    const [stage, setStage] = useState<SimpleStep | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [coordinatesStage, setCoordinatesStage] = useState<{ latitude: number; longitude: number } | null>(null);
    const [coordinatesAccommodation, setCoordinatesAccommodation] = useState<Array<{ latitude: number; longitude: number; name: string; arrivalDateTime: string }>>([]);
    const [coordinatesActivities, setCoordinatesActivities] = useState<Array<{
        address: string; latitude: number; longitude: number; name: string; arrivalDateTime: string 
}>>([]);
    const mapRef = useRef<MapView>(null);

    // Récupérer l'id de l'étape
    const { stepId } = route.params;
    console.log('ID de l\'étape:', stepId);

    // Appeler l'API lors du montage du composant
    useEffect(() => {
        fetchStage();
    }, []);

    // Fonction pour récupérer les coordonnées de l'étape
    const getCoordinates = async (address: string) => {
        try {
            const response = await Geocoder.from(address);
            const { lat, lng } = response.results[0].geometry.location;
            console.log(`Coordonnées pour ${address}:`);
            return { latitude: lat, longitude: lng };
        } catch (error) {
            console.warn('Erreur lors de la récupération des coordonnées:', error);
            return null; // Retourner null en cas d'erreur
        }
    };

    // Appeler l'API
    const fetchStage = async () => {
        try {
            const response = await fetch(`https://mon-petit-roadtrip.vercel.app/stages/${stepId}`);
            const data = await response.json();
            console.log('Données de l\'API:'); // Ajoutez ce log
            setStage(data);

            // Récupérer les coordonnées de l'adresse
            const coords = await getCoordinates(data.address);
            if (coords) {
                setCoordinatesStage(coords);
            }

            // Récupérer les coordonnées des adresses des accommodations
            const accommodations = data.accommodations;
            const accommodationCoords = await Promise.all(accommodations.map(async (accommodation: any) => {
                const coords = await getCoordinates(accommodation.address);
                return coords ? { ...accommodation, latitude: coords.latitude, longitude: coords.longitude } : null;
            }));
            setCoordinatesAccommodation(accommodationCoords.filter(coord => coord !== null));

            // Récupérer les coordonnées des adresses des activities
            const activities = data.activities;
            const activitiesCoords = await Promise.all(activities.map(async (activity: any) => {
                const coords = await getCoordinates(activity.address);
                return coords ? { ...activity, latitude: coords.latitude, longitude: coords.longitude } : null;
            }));
            setCoordinatesActivities(activitiesCoords.filter(coord => coord !== null));

        } catch (error) {
            console.error('Erreur lors de la récupération de l\'étape:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Utiliser un useEffect pour surveiller les changements de l'état stage
    useEffect(() => {
        if (stage) {
            console.log('Stage mis à jour:', stage.name, stage.latitude, stage.longitude);
        }
    }, [stage]);

    // Utiliser un useEffect pour surveiller les changements des coordonnées
    useEffect(() => {
        if (coordinatesStage) {
            console.log('Coordonnées mises à jour:', coordinatesStage.latitude, coordinatesStage.longitude);
        }
    }, [coordinatesStage]);

    // Fonction pour ajuster la carte
    const adjustMap = () => {
        if (mapRef.current) {
            const allCoordinates = [
                coordinatesStage,
                ...coordinatesAccommodation,
                ...coordinatesActivities,
            ].filter(coord => coord && coord.latitude !== undefined && coord.longitude !== undefined);

            if (allCoordinates.length > 0) {
                console.log('Ajustement de la carte avec les coordonnées');
                mapRef.current.fitToCoordinates(allCoordinates, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }
        }
    };

    // Ajuster la carte pour s'adapter aux marqueurs
    useEffect(() => {
        adjustMap();
    }, [coordinatesStage, coordinatesAccommodation, coordinatesActivities]);

    const renderMarkerAccommodations = useCallback(() => {
        if (!coordinatesAccommodation) return null;
        return coordinatesAccommodation.map((accommodation, index) => (
            <Marker
                key={`${accommodation.latitude}-${accommodation.longitude}`}
                coordinate={{
                    latitude: accommodation.latitude,
                    longitude: accommodation.longitude,
                }}
                title={accommodation.name}
                description={accommodation.arrivalDateTime}
                tracksViewChanges={false}
            >
                <Fontawesome5 name="campground" size={24} color="green" />
            </Marker>
        ));
    }, [coordinatesAccommodation]);

    const renderMarkerActivities = useCallback(() => {
        if (!coordinatesActivities) return null;
        return coordinatesActivities.map((activity, index) => (
            <Marker
                key={`${activity.latitude}-${activity.longitude}`}
                coordinate={{
                    latitude: activity.latitude,
                    longitude: activity.longitude,
                }}
                title={activity.name}
                description={activity.address}
                tracksViewChanges={false}
            >
                <Fontawesome5 name="hiking" size={24} color="red" />
            </Marker>
        ));
    }, [coordinatesActivities]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStage();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    if (!stage || !coordinatesStage || coordinatesStage.latitude === undefined || coordinatesStage.longitude === undefined) {
        return (
            <View style={styles.errorContainer}>
                <Text>Erreur: Les coordonnées de l'étape ne sont pas disponibles.</Text>
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.mapContainer}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <MapView
                ref={(ref) => {
                    mapRef.current = ref; // Assurez-vous que mapRef est mis à jour ici
                    console.log('MapView ref:'); // Ajoutez un log pour vérifier si la référence est attachée
                }}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: coordinatesStage.latitude, 
                    longitude: coordinatesStage.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                onMapReady={() => {
                    console.log('Carte prête.');
                    adjustMap();
                }}
            >
                {renderMarkerAccommodations()}
                {renderMarkerActivities()}
            </MapView>
            <TabView
                navigationState={{
                    index: 0,
                    routes: [
                        { key: 'infos', title: 'Infos' },
                        { key: 'accommodations', title: 'Hébergements' },
                        { key: 'activities', title: 'Activités' }
                    ]
                }}
                renderScene={() => null}
                onIndexChange={() => null}
                initialLayout={{ width: 0, height: 0 }}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
        height: 400, // Ajoutez une hauteur fixe pour le MapView
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});