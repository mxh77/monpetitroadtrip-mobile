import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import type { Event } from './types';
import dayjs from 'dayjs';

interface WeekViewProps {
  events: Event[];
  startHour: number;
  endHour: number;
  onEventPress?: (event: Event) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ events, startHour, endHour, onEventPress }) => {
  // Récupération des jours de la semaine à partir de la date actuelle
  const startOfWeek = dayjs().startOf('week'); // Commence lundi
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

  return (
    <View style={styles.container}>
      {/* Affichage des jours de la semaine */}
      <View style={styles.weekHeader}>
        {daysOfWeek.map(day => (
          <Text key={day.toString()} style={styles.dayHeader}>
            {day.format('ddd DD')}
          </Text>
        ))}
      </View>

      {/* ScrollView pour la grille horaire */}
      <ScrollView style={styles.scrollContainer}>
        {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map(hour => (
          <View key={hour} style={styles.hourRow}>
            {/* Colonne des heures */}
            <Text style={styles.hourLabel}>{hour}:00</Text>

            {/* Colonnes des jours */}
            <View style={styles.dayColumns}>
              {daysOfWeek.map(day => (
                <View key={day.toString()} style={styles.dayCell}>
                  {/* Filtrage des événements du jour et de l'heure */}
                  {events
                    .filter(event => dayjs(event.startTime).isSame(day, 'day') && dayjs(event.startTime).hour() === hour)
                    .map(event => (
                      <TouchableOpacity
                        key={event.id}
                        onPress={() => onEventPress?.(event)}
                        style={[styles.event, { backgroundColor: event.color || '#007AFF' }]}
                      >
                        <Text style={styles.eventText}>{event.title}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10
  },
  dayHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '14.2%' // 7 jours en colonnes
  },
  scrollContainer: {
    flex: 1
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  hourLabel: {
    width: 50,
    fontSize: 12,
    color: '#555',
    textAlign: 'center'
  },
  dayColumns: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  dayCell: {
    width: '14.2%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  event: {
    padding: 5,
    borderRadius: 5,
    marginVertical: 2
  },
  eventText: {
    color: '#fff',
    fontSize: 10
  }
});

export default WeekView;
