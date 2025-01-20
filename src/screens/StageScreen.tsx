import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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
import { StackScreenProps } from '@react-navigation/stack';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';
console.log('Google API Key:', GOOGLE_API_KEY);
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
  const [markers, setMarkers] = useState<{ latitude: number; longitude: number; title: string; type: string; description: string }[]>([]);
  const [accommodations, setAccommodations] = useState<{ name: string; address: string; coordinates?: { latitude: number; longitude: number }; thumbnail?: { url: string }; arrivalDateTime: string; departureDateTime: string; website: string }[]>([]);
  const [activities, setActivities] = useState<{ name: string; address: string; coordinates?: { latitude: number; longitude: number }; thumbnail?: { url: string }; startDateTime: string; endDateTime: string; website: string }[]>([]);
  const mapViewRef = useRef<MapView>(null);
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    { key: 'general', title: 'Infos Générales' },
    ...(type === 'stage' ? [{ key: 'accommodations', title: 'Hébergements' }, { key: 'activities', title: 'Activités' }] : []),
  ]);

  const isMounted = useRef(true);
  const [fetchingCoordinates, setFetchingCoordinates] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [mapKey, setMapKey] = useState(Math.random().toString());

  useEffect(() => {
    console.log('StageScreen mounted');
    return () => {
      console.log('StageScreen unmounted');
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setMapKey(mapKey + 1);
  }, [markers]);

  useEffect(() => {
    const fitMapToMarkers = () => {
      //console.log('Fitting map to markers...');
      if (markers.length > 0) {
        //console.log('Fitting map to markers:', markers);
        const markerCoordinates = markers.map(marker => ({
          latitude: marker.latitude,
          longitude: marker.longitude,
        }));
        setTimeout(() => {
          if (mapViewRef.current) {
            mapViewRef.current.fitToCoordinates(markerCoordinates, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
        }, 50); // Adjust the timeout duration as needed
      }
    };

    //console.log('useEffect triggered');
    //console.log('markers:', markers);
    //console.log('mapViewRef.current:', mapViewRef.current);

    fitMapToMarkers();
  }, [markers]);

  const fetchStageDetails = async () => {
    console.log('Fetching stage details...');
    setLoading(true); // Commencez le chargement
    try {
      const url = type === 'stage'
        ? `https://mon-petit-roadtrip.vercel.app/stages/${stageId}`
        : `https://mon-petit-roadtrip.vercel.app/stops/${stageId}`;
      //console.log(`Fetching from URL: ${url}`);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Stage details fetched:', data.address);
      if (isMounted.current) {
        setStageTitle(data.name);
        setStageAddress(data.address);
        setStageArrivalDateTime(data.arrivalDateTime);
        setStageDepartureDateTime(data.departureDateTime);
        setStageNotes(data.notes);
        setAccommodations(data.accommodations || []);
        setActivities(data.activities || []);
        setCoordinates(data.coordinates || null);
        setLoading(false); // Terminez le chargement
        setDataFetched(true); // Marquez les données comme récupérées
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du stage:', error);
      if (isMounted.current) {
        setLoading(false); // Terminez le chargement
      }
    }
  };

  const fetchCoordinates = async () => {
    console.log('Fetching coordinates...');
    setFetchingCoordinates(true);
    try {
      let stageCoords = coordinates;

      if (stageAddress) {
        console.log('Geocoding stage address:', stageAddress);
        stageCoords = await geocodeAddress(stageAddress);
      } else {
        console.error('Erreur : l\'adresse du stage est indéfinie.');
      }
      if (stageCoords && isMounted.current) {
-        setCoordinates(stageCoords);
      }


      const accommodationMarkers = await Promise.all(
        accommodations.map(async (accommodation) => {
          const coords = accommodation.coordinates || await geocodeAddress(accommodation.address);
          if (coords) {
            // console.log('Geocoded accommodation:', accommodation.name, coords);
            return { ...coords, title: accommodation.name, type: 'bed', description: accommodation.address };
          }
          return null;
        })
      );

      const activityMarkers = await Promise.all(
        activities.map(async (activity) => {
          const coords = activity.coordinates || await geocodeAddress(activity.address);
          if (coords) {
            //console.log('Geocoded activity:', activity.name, coords);
            return { ...coords, title: activity.name, type: 'flag', description: activity.address };
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
        console.log('Markers set:');

        if (mapViewRef.current && validMarkers.length > 0) {
          const coordinates = validMarkers.map(marker => ({ latitude: marker.latitude, longitude: marker.longitude }));
          console.log('Fitting map to coordinates:', coordinates);
          mapViewRef.current.fitToCoordinates(coordinates, {
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
      console.log('Finished fetching coordinates');
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('StageScreen focused');
      if (!dataFetched) {
        fetchStageDetails();
      }
    }, [stageId, stageAddress, dataFetched])
  );

  useEffect(() => {
    if (dataFetched) {
      console.log('Hook fetching coordinates...');
      fetchCoordinates();
    }
  }, [accommodations, activities, stageAddress, dataFetched]);

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
      console.error('Erreur lors du géocodage:', error.origin.error_message);
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
    console.log('Loading or fetching coordinates...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  console.log('Rendering StageScreen with data');
  console.log('coordinates:', coordinates);
  console.log('Number of markers:', markers.length);


  if (!coordinates) {
    console.log('No coordinates found');
    return (
      <View style={styles.container}>
        <Text>Erreur : impossible de récupérer les coordonnées de l'adresse.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.tabContainer}>
        <TabView
          renderTabBar={props => (
            <TabBar
              {...props}
              indicatorStyle={styles.indicator}
              style={styles.tabBar}
            />
          )}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={() => { }}
        />
      </View>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapViewRef}
          key={mapKey}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >         
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 2,

  },
  tabContainer: {
    flex: 1, // 70% of the height
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
  listButton: {
    margin: 20,
  },
  scene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});