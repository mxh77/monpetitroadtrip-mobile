import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, StatusBar, Dimensions, TouchableOpacity } from 'react-native';
import { PanGestureHandler, State, LongPressGestureHandler } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { Event as EventType } from './types';

interface DayViewProps {
  events: EventType[];
  startHour: number;
  endHour: number;
  slotDuration: number; // Durée d'un créneau en minutes (ex: 15, 30, 60)
  defaultScrollHour?: number; // Heure par défaut pour le défilement initial
  currentDate?: Date; // Date actuelle
  onEventPress?: (event: EventType) => void;
  onEventChange?: (event: EventType) => void; // Callback pour gérer le changement de position de l'événement
}

const { width: DEVICE_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 60; // Hauteur de base pour une heure
const HOUR_COLUMN_WIDTH = 60; // Largeur de la colonne des heures
const EVENT_COLUMN_WIDTH = DEVICE_WIDTH - HOUR_COLUMN_WIDTH - 20; // Largeur des événements ajustée à la largeur du device
const MOVE_STEP = 15; // Pas de déplacement en minutes
const BOTTOM_MARGIN = 100; // Marge supplémentaire en bas

type TimeSlot = { start: number; end: number; top: number }; // Créneau horaire en minutes
type Event = { start: number; end: number; id: string; color: string; title: string };
type PositionedEvent = Event & { top: number; height: number; width: number; left: number; color: string; title: string };

const DayView: React.FC<DayViewProps> = ({ events, startHour, endHour, slotDuration, onEventPress, onEventChange, defaultScrollHour = 0, currentDate }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [_draggingEvent, setDraggingEvent] = useState<EventType | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [bubblePosition, setBubblePosition] = useState<{ top: number; left: number } | null>(null);
  const [dragTimeout, setDragTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fonction pour diviser les événements multi-jours en segments quotidiens
  const splitMultiDayEvents = (events: EventType[]): EventType[] => {
    const splitEvents: EventType[] = [];

    events.forEach(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);

      // Si l'événement ne s'étend pas sur plusieurs jours, l'ajouter tel quel
      if (start.toISOString().slice(0, 10) === end.toISOString().slice(0, 10)) {
        splitEvents.push(event);
      } else {
        // Diviser l'événement en segments quotidiens
        let currentStart = new Date(start);
        while (currentStart < end) {
          const currentEnd = new Date(currentStart);
          currentEnd.setUTCHours(23, 59, 59, 999);

          if (currentEnd > end) {
            currentEnd.setTime(end.getTime());
          }

          splitEvents.push({
            ...event,
            id: `${event.id}-${currentStart.toISOString()}`, // Générer une clé unique pour chaque segment
            startTime: new Date(currentStart),
            endTime: new Date(currentEnd),
          });

          console.log("Split event", event, currentStart, currentEnd);
          currentStart = new Date(currentEnd);
          currentStart.setUTCHours(0, 0, 0, 0);
          currentStart.setUTCDate(currentStart.getUTCDate() + 1);
        }
      }
    });

    return splitEvents;
  };

  // Filtrer les événements pour ne garder que ceux dont la date est la même que currentDate
  const filteredEvents = splitMultiDayEvents(events).filter(event => {
    const eventDate = new Date(event.startTime);
    return (
      eventDate.getUTCFullYear() === currentDate?.getUTCFullYear() &&
      eventDate.getUTCMonth() === currentDate?.getUTCMonth() &&
      eventDate.getUTCDate() === currentDate?.getUTCDate()
    );
  });

  // Convertir les événements en minutes depuis minuit et les trier par heure de début
  const convertedEvents: Event[] = filteredEvents.map(event => ({
    id: event.id,
    start: new Date(event.startTime).getUTCHours() * 60 + new Date(event.startTime).getUTCMinutes(),
    end: new Date(event.endTime).getUTCHours() * 60 + new Date(event.endTime).getUTCMinutes(),
    title: event.title,
    color: event.color || '#000000', // Provide a default color if undefined
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
    const top = ((event.start - startHour * 60) / 60) * HOUR_HEIGHT;  // Position verticale basée sur le créneau horaire
    const left = col * (EVENT_COLUMN_WIDTH / maxOverlaps);  // Position horizontale
    const width = EVENT_COLUMN_WIDTH / maxOverlaps;  // Largeur de chaque événement
    const height = ((event.end - event.start) / 60) * HOUR_HEIGHT;  // Hauteur proportionnelle au créneau

    // Ajouter l'événement positionné à la liste
    positionedEvents.push({
      ...event,
      top,
      left,
      width,
      height,
      color: event.color,
      title: event.title
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
          slotOverlaps[slot.start] = (slotOverlaps[slot.start] ?? 0) + 1;        
        }
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

  // Définir la position de défilement initiale
  useEffect(() => {
    if (scrollViewRef.current) {
      const initialScrollPosition = (defaultScrollHour - startHour) * HOUR_HEIGHT;
      scrollViewRef.current.scrollTo({ y: initialScrollPosition, animated: false });
    }
  }, [defaultScrollHour, startHour]);

  // Fonction pour gérer le début du glisser-déposer
  const handleGestureEvent = (event: any, eventData: EventType) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      setDraggingEvent(eventData);
    } else if (event.nativeEvent.state === State.END) {
      setDraggingEvent(null);
      if (onEventChange) {
        const newStartTime = new Date(eventData.startTime);
        const newEndTime = new Date(eventData.endTime);
        const translationY = event.nativeEvent.translationY;
        const stepHeight = (MOVE_STEP / 60) * HOUR_HEIGHT;
        const steps = Math.round(translationY / stepHeight);
        newStartTime.setUTCMinutes(newStartTime.getUTCMinutes() + steps * MOVE_STEP);
        newEndTime.setUTCMinutes(newEndTime.getUTCMinutes() + steps * MOVE_STEP);
        onEventChange({ ...eventData, startTime: newStartTime, endTime: newEndTime });
      }
    }
  };

  const handleEventPress = (event: EventType, top: number, left: number) => {
    setSelectedEvent(event);
    setBubblePosition({ top, left });
  };

  const handleLongPress = (event: any, eventData: EventType) => {
    const timeout = setTimeout(() => {
      setDraggingEvent(eventData);
    }, 1500); // Délai de 500ms avant d'activer le drag and drop
    setDragTimeout(timeout);
  };

  const handlePressOut = () => {
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      setDragTimeout(null);
    }
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={{ height: (endHour - startHour) * HOUR_HEIGHT + BOTTOM_MARGIN }}>
      <View style={styles.container}>
        <View style={{ width: HOUR_COLUMN_WIDTH }}>
          {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map(hour => (
            <View key={hour} style={styles.hourRow}>
              <Text style={styles.hourLabel}>{`${hour}:00`}</Text>
            </View>
          ))}
        </View>
        <View style={{ width: EVENT_COLUMN_WIDTH, height: (endHour - startHour) * HOUR_HEIGHT + BOTTOM_MARGIN }}>
          {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map(hour => (
            <View key={hour} style={styles.hourLineContainer}>
              <View style={styles.hourLine} />
            </View>
          ))}
          {positionedEvents.map(event => {
            const animatedTop = useSharedValue(event.top);

            const animatedStyle = useAnimatedStyle(() => {
              return {
                top: withSpring(animatedTop.value),
              };
            });

            return (
              <LongPressGestureHandler
                key={event.id}
                onHandlerStateChange={(e) => {
                  if (e.nativeEvent.state === State.ACTIVE) {
                    handleLongPress(e, events.find(e => e.id === event.id)!);
                  } else if (e.nativeEvent.state === State.END) {
                    handlePressOut();
                  }
                }}
                minDurationMs={500} // Délai de 500ms avant d'activer le long press
              >
                <Animated.View
                  style={[
                    styles.eventBox,
                    animatedStyle,
                    {
                      height: event.height,
                      width: event.width,
                      left: event.left,
                      backgroundColor: event.color || '#007AFF',
                    },
                  ]}
                >
                  <PanGestureHandler
                    onGestureEvent={(e) => {
                      const stepHeight = (MOVE_STEP / 60) * HOUR_HEIGHT;
                      const steps = Math.round(e.nativeEvent.translationY / stepHeight);
                      animatedTop.value = event.top + steps * stepHeight;
                    }}
                    onHandlerStateChange={(e) => handleGestureEvent(e, events.find(e => e.id === event.id)!)}
                  >
                    <Animated.View style={{ flex: 1 }}>
                      <TouchableOpacity onPress={() => handleEventPress(events.find(e => e.id === event.id)!, event.top, event.left)}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </LongPressGestureHandler>
            );
          })}
        </View>
      </View>
      {selectedEvent && bubblePosition && (
        <View style={[styles.bubble, { top: bubblePosition.top - 40, left: bubblePosition.left + 10 }]}>
          <Text style={styles.bubbleText}>{selectedEvent.title}</Text>
          <Text style={styles.bubbleText}>Début: {new Date(selectedEvent.startTime).toLocaleTimeString('fr-FR', { timeZone: 'UTC' })}</Text>
          <Text style={styles.bubbleText}>Fin: {new Date(selectedEvent.endTime).toLocaleTimeString('fr-FR', { timeZone: 'UTC' })}</Text>
        </View>
      )}
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
    alignItems: 'flex-start',
    paddingRight: 5,
  },
  hourRow: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
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
    justifyContent: 'flex-start',
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
  bubble: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 1000,
  },
  bubbleText: {
    fontSize: 12,
    color: '#333',
  },
});

export default DayView;