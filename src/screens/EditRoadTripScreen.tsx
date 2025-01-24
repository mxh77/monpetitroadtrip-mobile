import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Alert, Platform, Image, ActivityIndicator, Modal } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../types';

type Props = StackScreenProps<RootStackParamList, 'EditRoadTrip'>;

type File = {
  _id: string;
  url: string;
  type: string;
  fileId: string;
  createdAt: string;
};

type RoadTrip = {
  _id?: string;
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
  documents: File[]; // Ajoutez cette propriété
  thumbnail?: File; // Ajoutez cette propriété
  stages: string[]; // IDs des stages
  stops: string[]; // IDs des stops
};

export default function EditRoadTripScreen({ route, navigation }: Props) {
  const { roadtripId } = route.params;
  const [roadtrip, setRoadTrip] = useState<RoadTrip>({
    userId: '',
    name: '',
    days: 0,
    startLocation: '',
    startDateTime: new Date(),
    endLocation: '',
    endDateTime: new Date(),
    currency: 'EUR',
    notes: '',
    photos: [],
    documents: [],
    thumbnail: undefined,
    stages: [],
    stops: [],
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false); // État pour gérer le chargement

  useEffect(() => {
    if (roadtripId) {
      // Fetch roadtrip details if roadtripId is provided
      const fetchRoadTrip = async () => {
        setLoading(true);
        try {
          console.log('Fetching roadtrip details for ID:', roadtripId);
          const response = await fetch(`https://mon-petit-roadtrip.vercel.app/roadtrips/${roadtripId}`);
          const data = await response.json();
          console.log('Fetched roadtrip data:', data);
          setRoadTrip({
            ...data,
            startDateTime: new Date(data.startDateTime),
            endDateTime: new Date(data.endDateTime),
            thumbnail: data.thumbnail ? { ...data.thumbnail, url: data.thumbnail.url } : undefined,
          });
        } catch (error) {
          console.error('Erreur lors de la récupération du roadtrip:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchRoadTrip();
    }
  }, [roadtripId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const method = roadtripId ? 'PUT' : 'POST';
      const url = roadtripId
        ? `https://mon-petit-roadtrip.vercel.app/roadtrips/${roadtripId}`
        : 'https://mon-petit-roadtrip.vercel.app/roadtrips';

      // Préparez les données JSON
      const data = {
        name: roadtrip.name,
        startLocation: roadtrip.startLocation,
        startDateTime: roadtrip.startDateTime.toISOString(),
        endLocation: roadtrip.endLocation,
        endDateTime: roadtrip.endDateTime.toISOString(),
        currency: roadtrip.currency,
        notes: roadtrip.notes,
        stages: roadtrip.stages,
        stops: roadtrip.stops,
        existingFiles: roadtrip.photos.concat(roadtrip.documents).map(file => ({ fileId: file.fileId, isDeleted: false })),
      };

      // Préparez le formulaire multipart/form-data
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));

      if (roadtrip.thumbnail && typeof roadtrip.thumbnail.url === 'string') {
        formData.append('thumbnail', {
          uri: roadtrip.thumbnail.url,
          name: 'thumbnail.jpg',
          type: 'image/jpeg',
        } as any);
      }

      // Tracez le corps de la requête
      console.log('Request body:', formData);

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Succès', 'Le roadtrip a été sauvegardé.');
        navigation.navigate('RoadTrips', { refresh: () => { } });
      } else {
        const data = await response.json();
        Alert.alert('Erreur', data.message || 'Une erreur est survenue.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    console.log('onStartDateChange');
    const currentDate = selectedDate || roadtrip.startDateTime;
    setShowStartDatePicker(Platform.OS === 'ios');
    setRoadTrip({ ...roadtrip, startDateTime: currentDate });
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    console.log('onEndDateChange');
    const currentDate = selectedDate || roadtrip.endDateTime;
    setShowEndDatePicker(Platform.OS === 'ios');
    setRoadTrip({ ...roadtrip, endDateTime: currentDate });
  };

  const handleSelectThumbnail = async () => {
    console.log('handleSelectThumbnail');
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log('Image picker result:', result);

    if (!result.canceled) {
      const selectedImageUri = result.assets[0].uri;
      console.log('Selected image URI:', selectedImageUri);

      setRoadTrip({ ...roadtrip, thumbnail: { url: selectedImageUri, _id: '', type: 'thumbnail', fileId: '', createdAt: '' } });
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        transparent={true}
        animationType="none"
        visible={loading}
        onRequestClose={() => { }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
      </Modal>
      <Text style={styles.title}>{roadtripId ? 'Modifier le RoadTrip' : 'Ajouter un RoadTrip'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom"
        value={roadtrip.name}
        onChangeText={(text) => {
          console.log('Name changed:', text);
          setRoadTrip({ ...roadtrip, name: text });
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Lieu de départ"
        value={roadtrip.startLocation}
        onChangeText={(text) => {
          console.log('Start location changed:', text);
          setRoadTrip({ ...roadtrip, startLocation: text });
        }}
      />
      <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
        <TextInput
          style={styles.input}
          placeholder="Date de départ"
          value={roadtrip.startDateTime.toLocaleDateString('fr-FR')}
          editable={false}
        />
      </TouchableOpacity>
      {showStartDatePicker && (
        <DateTimePicker
          value={roadtrip.startDateTime}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Lieu d'arrivée"
        value={roadtrip.endLocation}
        onChangeText={(text) => {
          console.log('End location changed:', text);
          setRoadTrip({ ...roadtrip, endLocation: text });
        }}
      />
      <TouchableOpacity onPress={() => setShowEndDatePicker(true)}>
        <TextInput
          style={styles.input}
          placeholder="Date d'arrivée"
          value={roadtrip.endDateTime.toLocaleDateString('fr-FR')}
          editable={false}
        />
      </TouchableOpacity>
      {showEndDatePicker && (
        <DateTimePicker
          value={roadtrip.endDateTime}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Notes"
        value={roadtrip.notes}
        onChangeText={(text) => {
          console.log('Notes changed:', text);
          setRoadTrip({ ...roadtrip, notes: text });
        }}
      />
      <TouchableOpacity style={styles.button} onPress={handleSelectThumbnail}>
        <Text style={styles.buttonText}>Sélectionner une vignette</Text>
      </TouchableOpacity>
      {roadtrip.thumbnail ? (
        <Image source={{ uri: roadtrip.thumbnail.url }} style={styles.thumbnail} />
      ) : null}
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
  thumbnail: {
    width: '100%',
    height: 200,
    marginTop: 16,
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});