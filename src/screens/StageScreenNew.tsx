import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import MapView, { Marker } from 'react-native-maps';
import { TabView, SceneMap } from 'react-native-tab-view';
import { RootStackParamList } from '../../types';

type Props = StackScreenProps<RootStackParamList, 'StageStop'>;

type Stage = {
  _id: string;
  name: string;
  description: string;
  address: string;
  arrivalDateTime: string;
  departureDateTime: string;
  notes: string;
  accommodations?: Accommodation[];
  activities?: Activity[];
};

type Accommodation = {
  _id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type Activity = {
  _id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  startDateTime: string;
  endDateTime: string;
};

export default function StageStopScreen({ route, navigation }: Props) {
  const { stageId, type } = route.params;
  const [stageStop, setStageStop] = useState<Stage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStageStop = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://mon-petit-roadtrip.vercel.app/${type === 'stage' ? 'stages' : 'stops'}/${stageId}`);
      const data = await response.json();
      setStageStop(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStageStop();
  }, [stageId, type]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!stageStop) {
    return (
      <View style={styles.container}>
        <Text>Erreur lors de la récupération des données.</Text>
      </View>
    );
  }

  const renderMapView = () => (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: stageStop.accommodations?.[0]?.latitude || 0,
        longitude: stageStop.accommodations?.[0]?.longitude || 0,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {stageStop.accommodations?.map(accommodation => {
        console.log('Accommodation coordinates:', accommodation.latitude, accommodation.longitude);
        return (
          <Marker
            key={accommodation._id}
            coordinate={{ latitude: accommodation.latitude, longitude: accommodation.longitude }}
            title={accommodation.name}
            description={accommodation.address}
          />
        );
      })}
      {stageStop.activities?.map(activity => {
        console.log('Activity coordinates:', activity.latitude, activity.longitude);
        return (
          <Marker
            key={activity._id}
            coordinate={{ latitude: activity.latitude, longitude: activity.longitude }}
            title={activity.name}
            description={activity.address}
          />
        );
      })}
    </MapView>
  );

  const renderGeneralInfo = () => (
    <View style={styles.tabContent}>
      <Text style={styles.title}>{stageStop.name}</Text>
      <Text>{stageStop.description}</Text>
      <Text>{stageStop.address}</Text>
      <Text>Arrivée: {new Date(stageStop.arrivalDateTime).toLocaleString('fr-FR')}</Text>
      <Text>Départ: {new Date(stageStop.departureDateTime).toLocaleString('fr-FR')}</Text>
      <Text>Notes: {stageStop.notes}</Text>
    </View>
  );

  const renderAccommodations = () => (
    <View style={styles.tabContent}>
      {stageStop.accommodations?.map(accommodation => (
        <View key={accommodation._id} style={styles.item}>
          <Text style={styles.itemTitle}>{accommodation.name}</Text>
          <Text>{accommodation.address}</Text>
        </View>
      ))}
    </View>
  );

  const renderActivities = () => (
    <View style={styles.tabContent}>
      {stageStop.activities?.map(activity => (
        <View key={activity._id} style={styles.item}>
          <Text style={styles.itemTitle}>{activity.name}</Text>
          <Text>{activity.address}</Text>
          <Text>Début: {new Date(activity.startDateTime).toLocaleString('fr-FR')}</Text>
          <Text>Fin: {new Date(activity.endDateTime).toLocaleString('fr-FR')}</Text>
        </View>
      ))}
    </View>
  );

  const renderScene = SceneMap({
    general: renderGeneralInfo,
    accommodations: renderAccommodations,
    activities: renderActivities,
  });

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{
          index: 0,
          routes: [
            { key: 'general', title: 'Infos Générales' },
            { key: 'accommodations', title: 'Accommodations' },
            { key: 'activities', title: 'Activities' },
          ],
        }}
        renderScene={renderScene}
        onIndexChange={() => { }}
        initialLayout={{ width: 300 }}
      />
      {renderMapView()}

    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    height: '40%',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  item: {
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});