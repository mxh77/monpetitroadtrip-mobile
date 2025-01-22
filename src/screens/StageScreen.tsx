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

type Props = StackScreenProps<RootStackParamList, 'Stage'>;

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';
Geocoder.init(GOOGLE_API_KEY);

export default function StageScreen({ route, navigation }: Props) {
    // États
    const [stage, setStage] = useState<Step | null>(null);
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

            const transformedData = {
                ...data,
                id: data._id,
            };
            console.log('Données transformées:', data._id)
            setStage(transformedData);

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
            console.log('Stage mis à jour:', stage.id, stage.name, stage.latitude, stage.longitude);
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

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={fetchStage} style={{ padding: 10, marginRight: 10 }}>
                    <Fontawesome5 name="sync" size={20} color="black" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

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

    const navigateToEditStageInfo = () => {
        navigation.navigate('EditStageInfo', { stage: stage, refresh: fetchStage });
    }

    const GeneralInfo = () => {
        const formattedArrivalDateTime = stage.arrivalDateTime ? formatDateTimeUTC2Digits(stage.arrivalDateTime) : 'N/A';
        const formattedDepartureDateTime = stage.departureDateTime ? formatDateTimeUTC2Digits(stage.departureDateTime) : 'N/A';

        return (
            <ScrollView style={styles.tabContent}>
                <View style={styles.generalInfoContainer}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nom de l'étape :</Text>
                        <Text style={styles.infoValue}>{stage.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Adresse :</Text>
                        <Text style={styles.infoValue}>{stage.address}</Text>
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
                        <Text style={styles.infoValue}>{stage.notes}</Text>
                    </View>
                    <Button
                        mode="contained"
                        onPress={navigateToEditStageInfo}
                        style={styles.editButton}
                    >
                        Éditer
                    </Button>
                </View>
            </ScrollView>
        );
    };

    const Accommodations = () => (
        <ScrollView style={styles.tabContent}>
            {stage.accommodations.map((accommodation, index) => (
                <Card key={index} style={styles.card}>
                    <Card.Title titleStyle={styles.cardTitle} title={accommodation.name} />
                    <Card.Content>
                        <Text style={styles.infoText}>Du {formatDateJJMMAA(accommodation.arrivalDateTime)} au {formatDateJJMMAA(accommodation.departureDateTime)}</Text>
                    </Card.Content>
                    <Card.Content>
                        {accommodation.thumbnail && (
                            <TouchableOpacity onPress={() => navigation.navigate('Accommodation', accommodation)}>
                                <Image source={{ uri: accommodation.thumbnail.url }} style={styles.thumbnail} />
                            </TouchableOpacity>
                        )}
                        <Text style={styles.infoText}>{accommodation.address}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Button
                                mode="contained"
                                onPress={() => openWebsite(accommodation.website)}
                                style={styles.mapButton}
                            >
                                Ouvrir Site Web
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => openInGoogleMaps(accommodation.address)}
                                style={styles.mapButton}
                            >
                                Ouvrir dans Google Maps
                            </Button>
                        </View>
                    </Card.Content>
                </Card>
            ))}
        </ScrollView>
    );

    const Activities = () => (
        <ScrollView style={styles.tabContent}>
            {stage.activities.map((activity, index) => (
                <Card key={index} style={styles.card}>
                    <Card.Title titleStyle={styles.cardTitle} title={activity.name} />
                    <Card.Content>
                        <Text style={styles.infoText}>Du {formatDateJJMMAA(activity.startDateTime)} au {formatDateJJMMAA(activity.endDateTime)}</Text>
                    </Card.Content>
                    <Card.Content>
                        {activity.thumbnail && (
                            <Image source={{ uri: activity.thumbnail.url }} style={styles.thumbnail} />
                        )}
                        <Text style={styles.infoText}>{activity.address}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Button
                                mode="contained"
                                onPress={() => openWebsite(activity.website)}
                                style={styles.mapButton}
                            >
                                Ouvrir Site Web
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => openInGoogleMaps(activity.address)}
                                style={styles.mapButton}
                            >
                                Ouvrir dans Google Maps
                            </Button>
                        </View>
                    </Card.Content>
                </Card>
            ))}
        </ScrollView>
    );

    const renderScene = SceneMap({
        infos: GeneralInfo,
        accommodations: Accommodations,
        activities: Activities,
    });

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
        <View style={styles.container}>
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