import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Dimensions, ScrollView, Image } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import MapView, { Marker } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import Icon from 'react-native-vector-icons/FontAwesome';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Constants from 'expo-constants';
import { Button, Card } from 'react-native-paper';
import { openInGoogleMaps, openWebsite } from '../utils/utils';
import { formatDateTimeUTC2Digits, formatDateJJMMAA } from '../utils/dateUtils';
import { TouchableOpacity } from 'react-native';
import { RootStackParamList } from '../../types';
import { useFocusEffect } from '@react-navigation/native';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_API_KEY;
const API_URL = Constants.expoConfig?.extra?.API_URL;

console.log('Logging GOOGLE_API_KEY :', GOOGLE_API_KEY);

Geocoder.init(GOOGLE_API_KEY);

type Props = StackScreenProps<RootStackParamList, 'Stage'>;

export default function StageScreen({ route, navigation }: Props) {
    const { type, stageId } = route.params;
    const [loading, setLoading] = useState(true);
    const [stageTitle, setStageTitle] = useState(route.params.stageTitle);
    const [stageAddress, setStageAddress] = useState(route.params.stageAddress);
    const [stageArrivalDateTime, setStageArrivalDateTime] = useState(route.params.stageArrivalDateTime);
    const [stageDepartureDateTime, setStageDepartureDateTime] = useState(route.params.stageDepartureDateTime);
    const [stageNotes, setStageNotes] = useState(route.params.stageNotes);
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(route.params.stageCoordinates || null);
    const [markers, setMarkers] = useState<{ latitude: number; longitude: number; title: string; type: string }[]>([]);
    const [accommodations, setAccommodations] = useState<{ name: string; address: string; coordinates?: { latitude: number; longitude: number }; thumbnail?: { url: string }; arrivalDateTime: string; departureDateTime: string; website: string }[]>([]);
    const [activities, setActivities] = useState<{ name: string; address: string; coordinates?: { latitude: number; longitude: number }; thumbnail?: { url: string }; startDateTime: string; endDateTime: string; website: string }[]>([]);
    const mapRef = useRef<MapView>(null);
    const [index, setIndex] = useState(0);
    const [routes, setRoutes] = useState([
        { key: 'general', title: 'Infos Générales' },
        ...(type === 'stage' ? [{ key: 'accommodations', title: 'Hébergements' }, { key: 'activities', title: 'Activités' }] : []),
    ]);

    const isMounted = useRef(true);
    const [fetchingCoordinates, setFetchingCoordinates] = useState(false);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchStageDetails = async () => {
        try {
            console.log('Fetching stage details for stageId:', stageId);
            const url = type === 'stage'
                ? `${API_URL}/stages/${stageId}`
                : `${API_URL}/stops/${stageId}`;
            console.log('Fetching URL:', url);
            const response = await fetch(url);
            const data = await response.json();
            console.log('Stage data:', data);
            if (isMounted.current) {
                setStageTitle(data.name);
                setStageAddress(data.address);
                setStageArrivalDateTime(data.arrivalDateTime);
                setStageDepartureDateTime(data.departureDateTime);
                setStageNotes(data.notes);
                setAccommodations(data.accommodations || []);
                setActivities(data.activities || []);
                setCoordinates(data.coordinates || null);
                setLoading(false);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des détails du stage:', error);
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    useFocusEffect(
        useCallback(() => {
            console.log('useFocusEffect triggered for stageId:', stageId);
            fetchStageDetails();
        }, [stageId])
    );

    useEffect(() => {
        const fetchCoordinates = async () => {
            try {
                console.log('Fetching coordinates for stage');
                setFetchingCoordinates(true);
                let stageCoords = coordinates;
                if (!coordinates) {
                    if (stageAddress) {
                        console.log('Adresse du stage:', stageAddress);
                        stageCoords = await geocodeAddress(stageAddress);
                    } else {
                        console.log('Adresse du stage:', stageAddress);
                        console.error('Erreur : l\'adresse du stage est indéfinie.');
                    }
                    if (stageCoords && isMounted.current) {
                        setCoordinates(stageCoords);
                    }
                }

                const accommodationMarkers = await Promise.all(
                    accommodations.map(async (accommodation) => {
                        const coords = accommodation.coordinates || await geocodeAddress(accommodation.address);
                        if (coords) {
                            return { ...coords, title: 'Hébergement', type: 'bed' };
                        }
                        return null;
                    })
                );

                const activityMarkers = await Promise.all(
                    activities.map(async (activity) => {
                        const coords = activity.coordinates || await geocodeAddress(activity.address);
                        if (coords) {
                            return { ...coords, title: 'Activité', type: 'flag' };
                        }
                        return null;
                    })
                );

                const validMarkers = [
                    ...accommodationMarkers.filter(marker => marker !== null),
                    ...activityMarkers.filter(marker => marker !== null),
                ];

                if (isMounted.current) {
                    setMarkers(validMarkers);

                    if (mapRef.current && validMarkers.length > 0) {
                        const coordinates = validMarkers.map(marker => ({ latitude: marker.latitude, longitude: marker.longitude }));
                        mapRef.current.fitToCoordinates(coordinates, {
                            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                            animated: true,
                        });
                    }

                    setLoading(false);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des coordonnées:', error);
                if (isMounted.current) {
                    setLoading(false);
                }
            } finally {
                setFetchingCoordinates(false);
            }
        };

        fetchCoordinates();
    }, [accommodations, activities, stageAddress]);

    const geocodeAddress = async (address: string) => {
        try {
            console.log('Geocoding address:', address);
            const json = await Geocoder.from(address);
            if (json.results.length > 0) {
                const location = json.results[0].geometry.location;
                console.log('Geocoded coordinates:', location);
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

    const GeneralInfo = () => {
        const formattedArrivalDateTime = stageArrivalDateTime ? formatDateTimeUTC2Digits(stageArrivalDateTime) : 'N/A';
        const formattedDepartureDateTime = stageDepartureDateTime ? formatDateTimeUTC2Digits(stageDepartureDateTime) : 'N/A';

        return (
            <ScrollView style={styles.tabContent}>
                <View style={styles.generalInfoContainer}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nom de l'étape :</Text>
                        <Text style={styles.infoValue}>{stageTitle}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Adresse :</Text>
                        <Text style={styles.infoValue}>{stageAddress}</Text>
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
                        <Text style={styles.infoValue}>{stageNotes}</Text>
                    </View>
                    <Button
                        mode="contained"
                        onPress={() => navigation.navigate('EditStageInfo', {
                            type,
                            roadtripId: route.params.roadtripId,
                            stageId: route.params.stageId,
                            stageTitle,
                            stageAddress,
                            stageArrivalDateTime,
                            stageDepartureDateTime,
                            stageNotes,
                            refresh: fetchStageDetails
                        })}
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
            {accommodations.map((accommodation, index) => (
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
            {activities.map((activity, index) => (
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
        general: GeneralInfo,
        accommodations: Accommodations,
        activities: Activities,
    });

    if (loading || fetchingCoordinates) {
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
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: Dimensions.get("window").width }}
                renderTabBar={(props) => (
                    <TabBar
                        {...props}
                        indicatorStyle={styles.indicator}
                        style={styles.tabBar}
                        renderLabel={({ route, focused, color }: { route: any; focused: boolean; color: string }) => (
                            <Text style={[styles.tabLabel, { color: focused ? 'white' : 'gray' }]}>
                                {route.title}
                            </Text>
                        )}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        height: Dimensions.get("window").height * 0.4,
    },
    tabContent: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f9f9f9",
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
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
    tabBar: {
        backgroundColor: "#6200ee",
    },
    tabLabel: {
        fontWeight: "bold",
    },
    indicator: {
        backgroundColor: "white",
        height: 3,
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
    card: {
        marginBottom: 16,
    },
    cardTitle: {
        fontWeight: 'bold',
    },
    mapButton: {
        marginTop: 8,
    },
    thumbnail: {
        width: '100%',
        height: 150,
        marginBottom: 8,
    },
    editButton: {
        marginTop: 16,
    },
});