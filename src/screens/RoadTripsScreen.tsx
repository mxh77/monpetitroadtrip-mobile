import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Image, ActivityIndicator, Alert, Modal, Pressable, RefreshControl } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Importer l'icône
import { RootStackParamList } from '../../types';
import { FAB } from 'react-native-paper'; // Importer le bouton flottant

type Props = StackScreenProps<RootStackParamList, 'RoadTrips'>;

type File = {
  _id: string;
  url: string;
  type: string;
  fileId: string;
  createdAt: string;
};

type Roadtrip = {
  _id: string;
  userId: string;
  name: string;
  days: number;
  startLocation: string;
  startDateTime: Date;
  endLocation: string;
  endDateTime: Date;
  currency: string;
  notes: string;
  photos: File[]; // Ajoutez cette propriété
  thumbnail?: File; // Ajoutez cette propriété
};

export default function RoadTripsScreen({ navigation, route }: Props) {
  const [roadtrips, setRoadtrips] = useState<Roadtrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // État pour gérer le rafraîchissement
  const [selectedRoadtrip, setSelectedRoadtrip] = useState<Roadtrip | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchRoadtrips = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://mon-petit-roadtrip.vercel.app/roadtrips');
      const data = await response.json();
      setRoadtrips(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des roadtrips:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadtrips();
    navigation.setParams({ refresh: fetchRoadtrips });
  }, []);

  const handleAddRoadtrip = () => {
    navigation.navigate('EditRoadTrip', {}); // Naviguez vers la page d'ajout/modification de roadtrip
  };

  const handleEditRoadtrip = () => {
    if (selectedRoadtrip) {
      navigation.navigate('EditRoadTrip', { roadtripId: selectedRoadtrip._id }); // Naviguez vers la page de modification de roadtrip
      setModalVisible(false);
    }
  };

  const handleDeleteRoadtrip = async () => {
    if (selectedRoadtrip) {
      try {
        const response = await fetch(`https://mon-petit-roadtrip.vercel.app/roadtrips/${selectedRoadtrip._id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setRoadtrips(roadtrips.filter(roadtrip => roadtrip._id !== selectedRoadtrip._id));
          Alert.alert('Succès', 'Le roadtrip a été supprimé.');
        } else {
          Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression du roadtrip.');
        }
      } catch (error) {
        Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
      } finally {
        setModalVisible(false);
      }
    }
  };

  const handleLongPress = (roadtrip: Roadtrip) => {
    setSelectedRoadtrip(roadtrip);
    setModalVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoadtrips();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={roadtrips}
        keyExtractor={(item) => item._id}
        numColumns={2}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('RoadTrip', { roadtripId: item._id })}
            onLongPress={() => handleLongPress(item)} // Ajoutez une action de long press pour afficher le modal
          >
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail.url }} style={styles.cardImage} />
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <Text style={styles.cardImagePlaceholderText}>No Image</Text>
              </View>
            )}
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardText}>{item.days} jours</Text>
            <Text style={styles.cardText}>
              {`${new Date(item.startDateTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} - ${new Date(item.endDateTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}`}
            </Text>
            <Text style={styles.cardText}>{item.notes}</Text>
          </Pressable>
        )}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <FAB
        style={styles.fab}
        small
        icon="plus"
        onPress={handleAddRoadtrip}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable style={styles.modalButton} onPress={handleEditRoadtrip}>
              <Icon name="edit" size={24} color="#007BFF" />
              <Text style={styles.modalButtonText}>Modifier</Text>
            </Pressable>
            <Pressable style={styles.modalButton} onPress={handleDeleteRoadtrip}>
              <Icon name="delete" size={24} color="#FF0000" />
              <Text style={styles.modalButtonText}>Supprimer</Text>
            </Pressable>
            <Pressable style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  grid: {
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    margin: 8,
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: {
    color: '#fff',
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    paddingBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007BFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  modalButtonText: {
    fontSize: 18,
    marginLeft: 10,
  },
});