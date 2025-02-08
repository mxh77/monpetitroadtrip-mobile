import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import DayView from './DayView';
import type { TimetableProps } from './types';
import WeekView from './WeekView';

const Timetable: React.FC<TimetableProps> = ({
  events,
  mode = 'day',
  startHour = 8,
  endHour = 18,
  defaultScrollHour = 8,
  slotDuration = 15,
  currentDate = new Date(),
  onEventPress,
  onEventChange,
}) => {
  const [currentDateState, setCurrentDateState] = useState(currentDate);

  const goToPreviousDay = () => {
    setCurrentDateState(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const goToNextDay = () => {
    setCurrentDateState(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.navigation}>
        <Button title="Précédent" onPress={goToPreviousDay} />
        <Text style={styles.header}>{formatDate(currentDateState)}</Text>
        <Button title="Suivant" onPress={goToNextDay} />
      </View>
      <View style={styles.content}>
          <DayView
          key={currentDateState.toISOString()}  // Utiliser la date comme clé 
          events={events}
            startHour={startHour}
            endHour={endHour}
            slotDuration={slotDuration}
            defaultScrollHour={defaultScrollHour}
            currentDate={currentDateState}
            onEventPress={onEventPress}
            onEventChange={onEventChange}
          />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1
  }
});

export default Timetable;