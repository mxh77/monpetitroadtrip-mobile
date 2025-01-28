// RoadTripScreen.tsx
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootStackParamList, Roadtrip, StepType } from '../../types';
import { FAB } from 'react-native-paper';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { StepListScreen } from './StepListScreen';
import StepAgendaScreen from './StepAgendaScreen';
import { TouchableOpacity } from 'react-native-gesture-handler';

type Props = StackScreenProps<RootStackParamList, 'RoadTrip'>;

const Tab = createBottomTabNavigator();

export default function RoadTripScreenAgenda({ route, navigation }: Props) {
  const { roadtripId } = route.params;
  const [roadtrip, setRoadtrip] = useState<Roadtrip | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoadtrip = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://mon-petit-roadtrip.vercel.app/roadtrips/${roadtripId}`);
      const data = await response.json();
      const filteredData: Roadtrip = {
        idRoadtrip: data._id,
        name: data.name,
        steps: [
          ...data.stages.map((stage: any) => ({
            id: stage._id,
            type: 'stage' as StepType,
            name: stage.name,
            arrivalDateTime: stage.arrivalDateTime,
          })),
          ...data.stops.map((stop: any) => ({
            id: stop._id,
            type: 'stop' as StepType,
            name: stop.name,
            arrivalDateTime: stop.arrivalDateTime,
          })),
        ],
      };

      setRoadtrip(filteredData);
    } catch (error) {
      console.error('Erreur lors de la récupération du roadtrip:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadtrip();
  }, [roadtripId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchRoadtrip);
    return unsubscribe;
  }, [navigation, roadtripId]);

  const handleStepPress = (step: any) => {
    if (step.type === 'stage') {
      navigation.navigate('Stage', {
        type: 'stage',
        roadtripId,
        stepId: step.id,
        refresh: fetchRoadtrip,
      });
    } else {
      navigation.navigate('Stop', {
        type: 'stop',
        roadtripId,
        stepId: step.id,
        refresh: fetchRoadtrip,
      });
    }
  };

  const handleAddStep = () => {
    navigation.navigate('CreateStep', {
      roadtripId,
      refresh: fetchRoadtrip,
    });
  };

  const handleDeleteStep = async (stepId: string, type: string) => {
    try {
      let response;
      if (type === 'stage') {
        response = await fetch(`https://mon-petit-roadtrip.vercel.app/stages/${stepId}`, {
          method: 'DELETE',
        });
      } else {
        response = await fetch(`https://mon-petit-roadtrip.vercel.app/stops/${stepId}`, {
          method: 'DELETE',
        });
      }

      if (response.ok) {
        fetchRoadtrip();
        Alert.alert('Succès', 'L\'étape a été supprimée.');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression de l\'étape.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const confirmDeleteStep = (stepId: string, type: string) => {
    Alert.alert(
      'Supprimer l\'étape',
      'Êtes-vous sûr de vouloir supprimer cette étape ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => handleDeleteStep(stepId, type) },
      ],
      { cancelable: true }
    );
  };

  const renderRightActions = (stageId: string, type: any) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeleteStep(stageId, type)}>
      <Icon name="trash" size={24} color="white" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!roadtrip) {
    return (
      <View style={styles.container}>
        <Text>Erreur lors de la récupération du roadtrip.</Text>
      </View>
    );
  }

  return (
    <StepAgendaScreen/>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  item: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDateTime: {
    fontSize: 14,
    color: 'gray',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007BFF',
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '80%',
  },
});