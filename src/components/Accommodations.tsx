import React from 'react';
import {Text, View, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { formatDateJJMMAA } from '../utils/dateUtils';
import { openInGoogleMaps, openWebsite } from '../utils/utils';
import { TriangleCornerTopRight } from '../components/shapes';

const Accommodations = ({ stage, navigation, fetchStage }) => (
  <View style={{ flex: 1 }}>
    <ScrollView style={styles.tabContent}>
      {stage.accommodations.map((accommodation, index) => (
        <Card key={index} style={styles.card}>
          <Card.Title titleStyle={styles.cardTitle} title={accommodation.name} />
          <Card.Content>
            <Text style={styles.infoText}>Du {formatDateJJMMAA(accommodation.arrivalDateTime)} au {formatDateJJMMAA(accommodation.departureDateTime)}</Text>
          </Card.Content>
          <Card.Content>
            <TouchableOpacity onPress={() => navigation.navigate('EditAccommodation', { stage: null, accommodation, refresh: fetchStage })}>
              <Image
                source={accommodation.thumbnail ? { uri: accommodation.thumbnail.url } : require('../../assets/default-thumbnail.png')}
                style={styles.thumbnail}
              />
            </TouchableOpacity>
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
    <TouchableOpacity
      style={styles.triangleButtonContainer}
      onPress={() => navigation.navigate('EditAccommodation', { stage, accommodation: null, refresh: fetchStage })}
    >
      <TriangleCornerTopRight style={styles.triangleButton} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  tabContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
  },
  infoText: {
    marginBottom: 8,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  mapButton: {
    marginTop: 8,
  },
  triangleButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  triangleButton: {
    width: 50,
    height: 50,
  },
});

export default Accommodations;