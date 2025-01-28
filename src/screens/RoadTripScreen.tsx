import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Importer les icônes
import { RootStackParamList, Roadtrip, StepType } from '../../types';
import { FAB } from 'react-native-paper'; // Importer le bouton flottant
import Swipeable from 'react-native-gesture-handler/Swipeable'; // Importer Swipeable de react-native-gesture-handler
import { checkDateConsistency } from '../utils/controls'; // Importer la fonction checkDateConsistency

type Props = StackScreenProps<RootStackParamList, 'RoadTrip'>;

export default function RoadTripScreen({ route, navigation }: Props) {
  const { roadtripId } = route.params;
  const [roadtrip, setRoadtrip] = useState<Roadtrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);
  const [errors, setErrors] = useState<{ message: string, stepId: string, stepType: string }[]>([]);

  const fetchRoadtrip = async () => {
    setLoading(true); // Commencez le chargement
    try {
      const response = await fetch(`https://mon-petit-roadtrip.vercel.app/roadtrips/${roadtripId}`);
      const data = await response.json();
      console.log('Données de l\'API:');
      //console.log('Données de l\'API:', data);

      // Vérifiez la cohérence des dates et mettez à jour le nombre d'alertes
      const { alerts, errorMessages } = checkDateConsistency(data);
      console.log('Alertes:', alerts);
      setAlertCount(alerts);
      setErrors(errorMessages);

      // Filtrer les données pour ne conserver que les champs nécessaires
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
      console.log('Roadtrip récupéré:');
      //console.log('Roadtrip récupéré:', filteredData);


    } catch (error) {
      console.error('Erreur lors de la récupération du roadtrip:', error);
    } finally {
      setLoading(false); // Terminez le chargement
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRoadtrip();
    });
    return unsubscribe;
  }, [navigation, roadtripId]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
          // Bloquer l'action par défaut du retour
          e.preventDefault();
    
          // Naviguer vers RoadtripScreen
          console.log('Navigation vers RoadtripsScreen');
          navigation.navigate('RoadTrips');
        });
    
        // Nettoyage à la désactivation du composant
        return unsubscribe;
      }, [navigation]);

  // Afficher une icône de notification en haut à droite
  useEffect(() => {
    console.log('Mise à jour de la barre de navigation');
    navigation.setOptions({
      headerRight: () => (
        alertCount > 0 ? (
          <TouchableOpacity onPress={() => navigation.navigate('Errors', {roadtripId, errors})}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
              <Icon name="bell" size={24} color={alertCount > 0 ? 'red' : 'gray'} />
              {alertCount > 0 && (
                <Text style={{ color: 'red', marginLeft: 10 }}>{alertCount}</Text>
              )}
            </View>
          </TouchableOpacity>
        ) : null
      ),
    });
  }, [navigation, alertCount, errors]);

  // Fonction pour gérer la navigation vers la page de détails de l'étape ou de l'arrêt
  const handleStepPress = (step: any) => {
    if (step.type === 'stage') {
      navigation.navigate('Stage', {
        type: 'stage',
        roadtripId,
        stepId: step.id,
        refresh: fetchRoadtrip, // Passer la fonction de rafraîchissement
      });
    } else {
      navigation.navigate('Stop', {
        type: 'stop',
        roadtripId,
        stepId: step.id,
        refresh: fetchRoadtrip, // Passer la fonction de rafraîchissement
      });
    }
  };

  // Fonction pour gérer la navigation vers la page de création d'un nouveau step (CreateStepScreen)
  const handleAddStep = () => {
    navigation.navigate('CreateStep', {
      roadtripId,
      refresh: fetchRoadtrip, // Passer la fonction de rafraîchissement
    });
  }

  // Fonction pour gérer la suppression d'un step selon le type (Stage ou Stop)
  const handleDeleteStep = async (stepId: string, type: string) => {
    try {
      let response;
      //Adapter l'appel API selon le type de step
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
        fetchRoadtrip(); // Recharger les données
        Alert.alert('Succès', 'L\'étape a été supprimée.');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression de l\'étape.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    }
  }

  // Fonction pour afficher une alerte de confirmation avant suppression du stage ou du stop
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

  // Triez les étapes par arrivalDateTime
  const sortedSteps = roadtrip.steps.sort((a, b) =>
    new Date(a.arrivalDateTime).getTime() - new Date(b.arrivalDateTime).getTime()
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{roadtrip.name}</Text>
      <FlatList
        data={sortedSteps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item.id, item.type)}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleStepPress(item)}
            >
              <View style={styles.itemHeader}>
                <Icon
                  name={item.type === 'stage' ? 'bed' : 'flag'}
                  size={20}
                  color="#007BFF"
                  style={styles.itemIcon}
                />
                <Text style={styles.itemTitle}>{item.name}</Text>
              </View>
              <Text style={styles.itemDateTime}>
                {new Date(item.arrivalDateTime).toLocaleString('fr-FR', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'UTC'
                })}
              </Text>
            </TouchableOpacity>
          </Swipeable>
        )}
      />
      <FAB
        style={styles.fab}
        small
        icon="plus"
        onPress={handleAddStep}
      />
    </View>
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
  itemDescription: {
    fontSize: 16,
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