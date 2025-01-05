import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { formatDateJJMMAA, formatTimeHHMM } from '../utils/dateUtils';
import { RootStackParamList } from '../../types';

type Props = StackScreenProps<RootStackParamList, 'Accommodation'>;

export default function AccommodationScreen({ route, navigation }: Props) {
  const {
    name,
    address,
    website,
    phone,
    email,
    reservationNumber,
    confirmationDateTime,
    arrivalDateTime,
    departureDateTime,
    nights,
    price,
    notes,
  } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Nom</Text>
      <Text style={styles.infoText}>{name}</Text>

      <Text style={styles.sectionTitle}>Adresse</Text>
      <Text style={styles.infoText}>{address}</Text>

      <Text style={styles.sectionTitle}>Site Web</Text>
      {website ? (
        <Button mode="contained" onPress={() => navigation.navigate('WebView', { url: website })} style={styles.button}>
          Ouvrir le site web
        </Button>
      ) : (
        <Text style={styles.infoText}>Non disponible</Text>
      )}

      <Text style={styles.sectionTitle}>Téléphone</Text>
      <Text style={styles.infoText}>{phone || 'Non disponible'}</Text>

      <Text style={styles.sectionTitle}>Mail</Text>
      <Text style={styles.infoText}>{email || 'Non disponible'}</Text>

      <Text style={styles.sectionTitle}>N° Réservation</Text>
      <Text style={styles.infoText}>{reservationNumber || 'Non disponible'}</Text>

      <Text style={styles.sectionTitle}>Date Confirmation</Text>
      <Text style={styles.infoText}>{confirmationDateTime ? formatDateJJMMAA(confirmationDateTime) : 'Non disponible'}</Text>

      <Text style={styles.sectionTitle}>Date Arrivée</Text>
      <Text style={styles.infoText}>{formatDateJJMMAA(arrivalDateTime)}</Text>
      <Text style={styles.infoText}>{formatTimeHHMM(arrivalDateTime)}</Text>

      <Text style={styles.sectionTitle}>Date Départ</Text>
      <Text style={styles.infoText}>{formatDateJJMMAA(departureDateTime)}</Text>
      <Text style={styles.infoText}>{formatTimeHHMM(departureDateTime)}</Text>

      <Text style={styles.sectionTitle}>Nombre de nuits</Text>
      <Text style={styles.infoText}>{nights || 'Non disponible'}</Text>

      <Text style={styles.sectionTitle}>Prix</Text>
      <Text style={styles.infoText}>{price || 'Non disponible'}</Text>

      <Text style={styles.sectionTitle}>Notes</Text>
      <Text style={styles.infoText}>{notes || 'Non disponible'}</Text>
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
  button: {
    marginTop: 10,
  },
});