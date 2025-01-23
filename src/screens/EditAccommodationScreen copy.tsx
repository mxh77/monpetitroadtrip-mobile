import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { formatDateTimeUTC2Digits, formatDateJJMMAA, getTimeFromDate, formatTimeHHMM } from '../utils/dateUtils';

type Props = StackScreenProps<RootStackParamList, 'EditAccommodation'>;

export default function AccommodationScreen({ route, navigation }: Props) {
  const { accommodation, refresh } = route.params;

  const [isEditing, setIsEditing] = useState(true);
  const [formState, setFormState] = useState({
    name: accommodation.name,
    address: accommodation.address,
    website: accommodation.website,
    phone: accommodation.phone,
    email: accommodation.email,
    reservationNumber: accommodation.reservationNumber,
    confirmationDateTime: accommodation.confirmationDateTime,
    arrivalDateTime: accommodation.arrivalDateTime,
    departureDateTime: accommodation.departureDateTime,
    nights: accommodation.nights,
    price: accommodation.price,
    notes: accommodation.notes,

  });

  const handleSave = async () => {
    console.log('Accommodation ID:', accommodation._id);
    const url = `https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}`;
    const payload = {
      name: formState.name,
      address: formState.address,
      website: formState.website,
      phone: formState.phone,
      email: formState.email,
      reservationNumber: formState.reservationNumber,
      confirmationDateTime: formState.confirmationDateTime,
      arrivalDateTime: formState.arrivalDateTime,
      departureDateTime: formState.departureDateTime,
      nights: formState.nights,
      price: formState.price,
      notes: formState.notes,
    };

    console.log('Payload:', JSON.stringify(payload));

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedData = await response.json();
        console.log('Succès', 'Les informations ont été sauvegardées avec succès.');
        Alert.alert('Succès', 'Les informations ont été sauvegardées avec succès.');
        if (refresh) {
          refresh();
        }

        navigation.goBack();
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button onPress={handleSave} mode="contained">
          Enregistrer
        </Button>
      ),
    });
  }, [navigation, handleSave]);


  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Nom</Text>
      <TextInput
        style={styles.input}
        value={formState.name}
        onChangeText={(text) => setFormState({ ...formState, name: text })}
        editable={isEditing}
      />

      <Text style={styles.sectionTitle}>Adresse</Text>
      <TextInput
        style={styles.input}
        value={formState.address}
        onChangeText={(text) => setFormState({ ...formState, address: text })}
        editable={isEditing}
      />

      <Text style={styles.sectionTitle}>Site Web</Text>
      <TextInput
        style={styles.input}
        value={formState.website}
        onChangeText={(text) => setFormState({ ...formState, website: text })}
        editable={isEditing}
      />

      <Text style={styles.sectionTitle}>Téléphone</Text>
      <TextInput
        style={styles.input}
        value={formState.phone}
        onChangeText={(text) => setFormState({ ...formState, phone: text })}
        editable={isEditing}
      />

      <Text style={styles.sectionTitle}>Mail</Text>
      <TextInput
        style={styles.input}
        value={formState.email}
        onChangeText={(text) => setFormState({ ...formState, email: text })}
        editable={isEditing}
      />

      <Text style={styles.sectionTitle}>N° Réservation</Text>
      <TextInput
        style={styles.input}
        value={formState.reservationNumber}
        onChangeText={(text) => setFormState({ ...formState, reservationNumber: text })}
        editable={isEditing}
      />

      <Text style={styles.sectionTitle}>Date Confirmation</Text>
      <TextInput
        style={styles.input}
        value={formState.confirmationDateTime}
        onChangeText={(text) => setFormState({ ...formState, confirmationDateTime: text })}
        editable={isEditing}
      />

      <Text style={styles.sectionTitle}>Date Arrivée</Text>
      <TextInput
        style={styles.input}
        value={formState.arrivalDateTime}
        onChangeText={(text) => setFormState({ ...formState, arrivalDateTime: text })}
        editable={isEditing}
      />

      <Text style={styles.sectionTitle}>Date Départ</Text>
      <TextInput
        style={styles.input}
        value={formState.departureDateTime}
        onChangeText={(text) => setFormState({ ...formState, departureDateTime: text })}
        editable={isEditing}
      />

      <Text style={styles.sectionTitle}>Nombre de nuits</Text>
      <TextInput
        style={styles.input}
        value={formState.nights ? formState.nights.toString() : '0'}
        onChangeText={(text) => setFormState({ ...formState, nights: parseInt(text, 10) || 0 })}
        editable={isEditing}
      />

      <Text style={styles.sectionTitle}>Prix</Text>
      <TextInput
        style={styles.input}
        value={formState.price}
        onChangeText={(text) => setFormState({ ...formState, price: text })}
        editable={isEditing}
      />

      <Text style={styles.sectionTitle}>Notes</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={formState.notes}
        onChangeText={(text) => setFormState({ ...formState, notes: text })}
        multiline
        editable={isEditing}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  notesInput: {
    height: 100,
  },
  button: {
    marginTop: 10,
  },
});