import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { Button, Card } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Step } from '../../types';
import { openInGoogleMaps, openWebsite } from '../utils/utils';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Geocoder from 'react-native-geocoding';
import Constants from 'expo-constants';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';
import { formatDateTimeUTC2Digits, formatDateJJMMAA } from '../utils/dateUtils';

type Props = StackScreenProps<RootStackParamList, 'Stop'>;

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';
Geocoder.init(GOOGLE_API_KEY);

export default function StopScreen({ route, navigation }: Props) {
    // États
    const [stop, setStop] = useState<Step | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [coordinatesStop, setCoordinatesStop] = useState<{ latitude: number; longitude: number } | null>(null);
    const mapRef = useRef<MapView>(null);

    // Récupérer l'id de l'étape
    const { stepId } = route.params;
    console.log('ID de l\'étape:', stepId);

    // Appeler l'API lors du montage du composant
    useEffect(() => {
        fetchStop();
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
    const fetchStop = async () => {
        try {
            const response = await fetch(`https://mon-petit-roadtrip.vercel.app/stops/${stepId}`);
            const data = await response.json();
            console.log('Données de l\'API:'); // Ajoutez ce log

            const transformedData = {
                ...data,
                id: data._id,
            };
            console.log('Données transformées:', data._id)
            setStop(transformedData);

            // Récupérer les coordonnées de l'adresse
            const coords = await getCoordinates(data.address);
            if (coords) {
                setCoordinatesStop(coords);
            }


        } catch (error) {
            console.error('Erreur lors de la récupération de l\'étape:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Utiliser un useEffect pour surveiller les changements de l'état stop
    useEffect(() => {
        if (stop) {
            console.log('Stop mis à jour:', stop.id, stop.name, stop.latitude, stop.longitude);
        }
    }, [stop]);

    // Utiliser un useEffect pour surveiller les changements des coordonnées
    useEffect(() => {
        if (coordinatesStop) {
            console.log('Coordonnées mises à jour:', coordinatesStop.latitude, coordinatesStop.longitude);
        }
    }, [coordinatesStop]);

    // Fonction pour ajuster la carte
    const adjustMap = () => {
        if (mapRef.current) {
            const allCoordinates = [
                coordinatesStop,
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
    }, [coordinatesStop]);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={fetchStop} style={{ padding: 10, marginRight: 10 }}>
                    <Fontawesome5 name="sync" size={20} color="black" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const navigateToEditStopInfo = () => {
        navigation.navigate('EditStopInfo', { stop: stop, refresh: fetchStop });
    }

    const GeneralInfo = () => {
        const formattedArrivalDateTime = stop.arrivalDateTime ? formatDateTimeUTC2Digits(stop.arrivalDateTime) : 'N/A';
        const formattedDepartureDateTime = stop.departureDateTime ? formatDateTimeUTC2Digits(stop.departureDateTime) : 'N/A';

        return (
            <ScrollView style={styles.tabContent}>
                <View style={styles.generalInfoContainer}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nom de l'étape :</Text>
                        <Text style={styles.infoValue}>{stop.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Adresse :</Text>
                        <Text style={styles.infoValue}>{stop.address}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Date et heure d'arrivée :</Text>
                        <Text style={styles.infoValue}>{formattedArrivalDateTime}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Date et heure de départ :</Text>
                        <Text style={styles.infoValue}>{formattedDepartureDateTime}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Notes :</Text>
                        <Text style={styles.infoValue}>{stop.notes}</Text>
                    </View>
                    <Button
                        mode="contained"
                        onPress={navigateToEditStopInfo}
                        style={styles.editButton}
                    >
                        Éditer
                    </Button>
                </View>
            </ScrollView>
        );
    };

    const renderScene = SceneMap({
        infos: GeneralInfo,
    });

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStop();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    if (!stop || !coordinatesStop || coordinatesStop.latitude === undefined || coordinatesStop.longitude === undefined) {
        return (
            <View style={styles.errorContainer}>
                <Text>Erreur: Les coordonnées de l'étape ne sont pas disponibles.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={(ref) => {
                    mapRef.current = ref; // Assurez-vous que mapRef est mis à jour ici
                    console.log('MapView ref:'); // Ajoutez un log pour vérifier si la référence est attachée
                }}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: coordinatesStop.latitude,
                    longitude: coordinatesStop.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                onMapReady={() => {
                    console.log('Carte prête.');
                    adjustMap();
                }}
            >
            </MapView>
            <TabView
                navigationState={{
                    index: 0,
                    routes: [
                        { key: 'infos', title: 'Infos' }
                    ]
                }}
                renderScene={renderScene}
                onIndexChange={() => null}
                initialLayout={{ width: 0, height: 0 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
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
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        height: 400, // Ajoutez une hauteur fixe pour le MapView
    },
    tabContainer: {
        flex: 1,
    },
    tabContent: {
        padding: 16,
    },
    generalInfoContainer: {
        padding: 20,
        backgroundColor: "#fff",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    infoLabel: {
        fontWeight: 'bold',
        marginRight: 5,
    },
    infoValue: {
        flex: 1,
    },
    infoText: {
        fontSize: 16,
        marginBottom: 8,
    },
    editButton: {
        marginTop: 16,
    },
    card: {
        marginBottom: 16,
    },
    cardTitle: {
        fontWeight: 'bold',
    },
    thumbnail: {
        width: '100%',
        height: 150,
        marginBottom: 8,
    },
    mapButton: {
        marginTop: 8,
    },
});