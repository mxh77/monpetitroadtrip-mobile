import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface NavigationBarProps {
  currentDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ currentDate, onPreviousDay, onNextDay }) => {
  return (
    <View style={styles.container}>
      <Button title="Précédent" onPress={onPreviousDay} />
      <Text style={styles.header}>{currentDate.toDateString()}</Text>
      <Button title="Suivant" onPress={onNextDay} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
});

export default NavigationBar;
