import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  RoadTrips: undefined;
  EditRoadTrip: { roadtripId?: string }; // Ajoutez cette route
};

type Props = StackScreenProps<RootStackParamList, 'EditRoadTrip'>;

type RoadTrip = {
  _id?: string;
  name: string;
  startLocation: string;
  startDate: string;
  endLocation: string;
  endDate: string;
  days: number;
  notes: string;
};

export default function EditRoadTripScreen({ route, navigation }: Props) {
  const { roadtripId } = route.params;
  const [roadtrip, setRoadTrip] = useState<RoadTrip>({
    name: '',
    startLocation: '',
    startDate: '',
    endLocation: '',
    endDate: '',
    days: 0,
    notes: '',
  });

  useEffect(() => {
    if (roadtripId) {
      // Fetch roadtrip details if roadtripId is provided
      const fetchRoadTrip = async () => {
        try {
          const response = await fetch(`https://mon-petit-roadtrip.vercel.app/roadtrips/${roadtripId}`);
          const data = await response.json();
          setRoadTrip(data);
        } catch (error) {
          console.error('Erreur lors de la récupération du roadtrip:', error);
        }
      };

      fetchRoadTrip();
    }
  }, [roadtripId]);

  const handleSave = async () => {
    try {
      const method = roadtripId ? 'PUT' : 'POST';
      const url = roadtripId
        ? `https://mon-petit-roadtrip.vercel.app/roadtrips/${roadtripId}`
        : 'https://mon-petit-roadtrip.vercel.app/roadtrips';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roadtrip),
      });

      if (response.ok) {
        Alert.alert('Succès', 'Le roadtrip a été sauvegardé.');
        navigation.navigate('RoadTrips');
      } else {
        const data = await response.json();
        Alert.alert('Erreur', data.message || 'Une erreur est survenue.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{roadtripId ? 'Modifier le RoadTrip' : 'Ajouter un RoadTrip'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom"
        value={roadtrip.name}
        onChangeText={(text) => setRoadTrip({ ...roadtrip, name: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Lieu de départ"
        value={roadtrip.startLocation}
        onChangeText={(text) => setRoadTrip({ ...roadtrip, startLocation: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Date de départ"
        value={roadtrip.startDate}
        onChangeText={(text) => setRoadTrip({ ...roadtrip, startDate: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Lieu d'arrivée"
        value={roadtrip.endLocation}
        onChangeText={(text) => setRoadTrip({ ...roadtrip, endLocation: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Date d'arrivée"
        value={roadtrip.endDate}
        onChangeText={(text) => setRoadTrip({ ...roadtrip, endDate: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre de jours"
        value={roadtrip.days.toString()}
        onChangeText={(text) => setRoadTrip({ ...roadtrip, days: parseInt(text) })}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Notes"
        value={roadtrip.notes}
        onChangeText={(text) => setRoadTrip({ ...roadtrip, notes: text })}
      />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Sauvegarder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});