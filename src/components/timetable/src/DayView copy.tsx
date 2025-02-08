import React from 'react';
import { View, StyleSheet, Text, ScrollView, StatusBar, Dimensions, TouchableOpacity } from 'react-native';
import type { Event as EventType } from './types';

interface DayViewProps {
  events: EventType[];
  startHour: number;
  endHour: number;
  slotDuration: number; // Durée d'un créneau en minutes (ex: 15, 30, 60)
  onEventPress?: (event: EventType) => void;
}

const { width: DEVICE_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 60; // Hauteur de base pour une heure
const HOUR_COLUMN_WIDTH = 60; // Largeur de la colonne des heures
const EVENT_COLUMN_WIDTH = DEVICE_WIDTH - HOUR_COLUMN_WIDTH - 20; // Largeur des événements ajustée à la largeur du device

type TimeSlot = { start: number; end: number; top: number }; // Créneau horaire en minutes
type Event = { start: number; end: number; id: string };
type PositionedEvent = Event & { top: number; height: number; width: number; left: number };

const DayView: React.FC<DayViewProps> = ({ events, startHour, endHour, slotDuration, onEventPress }) => {
  // Convertir les événements en minutes depuis minuit
  const convertedEvents: Event[] = events.map(event => ({
    id: event.id,
    start: new Date(event.startTime).getHours() * 60 + new Date(event.startTime).getMinutes(),
    end: new Date(event.endTime).getHours() * 60 + new Date(event.endTime).getMinutes(),
  }));

  // Diviser la journée en créneaux horaires de slotDuration minutes
  const timeSlots: TimeSlot[] = Array.from({ length: (endHour - startHour) * (60 / slotDuration) }, (_, i) => {
    const start = startHour * 60 + i * slotDuration;
    return { start, end: start + slotDuration, top: (i * slotDuration * HOUR_HEIGHT) / 60 };
  });

  // Fonction pour vérifier si un événement chevauche un autre
  function chevauchement(event: Event, positionedEvent: PositionedEvent) {
    return (event.start < positionedEvent.end && event.end > positionedEvent.start);
  }

  // Fonction pour trouver la première colonne disponible
  function trouverColonneDispo(event: Event, positionedEvents: PositionedEvent[], maxOverlaps: number) {
    let col = 0;

    while (true) {
      let collisionTrouvee = false;

      // Vérifier si l'événement chevauche déjà un événement dans la même colonne
      for (let i = 0; i < positionedEvents.length; i++) {
        const positionedEvent = positionedEvents[i];
        if (positionedEvent && positionedEvent.left === col * (EVENT_COLUMN_WIDTH / maxOverlaps) && chevauchement(event, positionedEvent)) {
          collisionTrouvee = true;
          break;
        }
      }

      // Si aucune collision, la colonne est libre
      if (!collisionTrouvee) {
        break;
      }
      col++;  // Sinon, on essaye la colonne suivante
    }

    return col;
  }

  // Fonction pour positionner un événement
  function positionnerEvent(event: Event, positionedEvents: PositionedEvent[], maxOverlaps: number) {
    // Trouver la première colonne disponible
    const col = trouverColonneDispo(event, positionedEvents, maxOverlaps);

    // Déterminer la position de l'événement
    const top = (event.start / 1440) * (endHour - startHour) * HOUR_HEIGHT + (HOUR_HEIGHT/2);  // Position verticale basée sur le créneau horaire
    const left = col * (EVENT_COLUMN_WIDTH / maxOverlaps);  // Position horizontale
    const width = EVENT_COLUMN_WIDTH / maxOverlaps;  // Largeur de chaque événement
    const height = ((event.end - event.start) / 1440) * (endHour - startHour) * HOUR_HEIGHT;  // Hauteur proportionnelle au créneau

    // Ajouter l'événement positionné à la liste
    positionedEvents.push({
      ...event,
      top,
      left,
      width,
      height
    });
  }

  // Fonction pour positionner tous les événements
  function positionnerEvenements(convertedEvents: Event[], timeSlots: TimeSlot[]): PositionedEvent[] {
    let positionedEvents: PositionedEvent[] = [];

    // Compter les chevauchements par créneau
    let slotOverlaps: Record<number, number> = {};
    timeSlots.forEach(slot => slotOverlaps[slot.start] = 0);
    convertedEvents.forEach(event => {
      timeSlots.forEach(slot => {
        if (event.start < slot.end && event.end > slot.start) {
          slotOverlaps[slot.start] = (slotOverlaps[slot.start] ?? 0) + 1;        }
      });
    });

    // Déterminer le nombre maximal de chevauchements
    const maxOverlaps = Math.max(...Object.values(slotOverlaps), 1); // Evite la division par 0

    // Positionner tous les événements
    convertedEvents.forEach(event => {
      positionnerEvent(event, positionedEvents, maxOverlaps);
    });

    return positionedEvents;
  }

  // Positionner les événements
  const positionedEvents = positionnerEvenements(convertedEvents, timeSlots);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={{ height: (endHour - startHour) * HOUR_HEIGHT }}>
      <View style={styles.container}>
        <View style={{ width: HOUR_COLUMN_WIDTH }}>
          {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map(hour => (
            <View key={hour} style={styles.hourRow}>
              <Text style={styles.hourLabel}>{hour}:00</Text>
            </View>
          ))}
        </View>
        <View style={{ width: EVENT_COLUMN_WIDTH, height: (endHour - startHour) * HOUR_HEIGHT }}>
          {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map(hour => (
            <View key={hour} style={styles.hourLineContainer}>
              <View style={styles.hourLine} />
            </View>
          ))}
          {positionedEvents.map(event => {
            // Tracer les informations de débogage
            console.log(`Event ID: ${event.id}, Top: ${event.top}, Height: ${event.height}, Width: ${event.width}, Left: ${event.left}`);

            return (
              <View
                key={event.id}
                style={[
                  styles.eventBox,
                  {
                    top: event.top,
                    height: event.height,
                    width: event.width,
                    left: event.left,
                    backgroundColor: events.find(e => e.id === event.id)?.color || '#007AFF',
                  },
                ]}
              >
                <TouchableOpacity onPress={() => onEventPress?.(events.find(e => e.id === event.id)!)}>
                  <Text style={styles.eventTitle}>{events.find(e => e.id === event.id)?.title}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 0,
    paddingTop: StatusBar.currentHeight || 0,
  },
  hoursContainer: {
    alignItems: 'flex-end',
    paddingRight: 5,
  },
  hourRow: {
    height: HOUR_HEIGHT,
    justifyContent: 'center',
  },
  hourLabel: {
    fontSize: 14,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  hourLineContainer: {
    height: HOUR_HEIGHT,
    justifyContent: 'center',
  },
  hourLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  eventBox: {
    position: 'absolute', // Les événements doivent être en position absolue pour se positionner sur l'axe vertical
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DayView;