// StepListScreen.tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Icon from 'react-native-vector-icons/FontAwesome5';

export const StepListScreen = ({ steps, handleStepPress, renderRightActions }) => {
  // Triez les étapes par arrivalDateTime
  const sortedSteps = steps.sort((a, b) =>
    new Date(a.arrivalDateTime).getTime() - new Date(b.arrivalDateTime).getTime()
  );

  return (
    <FlatList
      data={sortedSteps}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Swipeable renderRightActions={() => renderRightActions(item.id, item.type)}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleStepPress(item)}
          >
            <View style={styles.itemHeader}>
              <Icon
                name={item.type === 'stage' ? 'bed' : 'flag'}
                size={20}
                color="#007BFF"
                style={styles.itemIcon}
              />
              <Text style={styles.itemTitle}>{item.name}</Text>
            </View>
            <Text style={styles.itemDateTime}>
              {new Date(item.arrivalDateTime).toLocaleString('fr-FR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
              })}
            </Text>
          </TouchableOpacity>
        </Swipeable>
      )}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDateTime: {
    fontSize: 14,
    color: 'gray',
  },
});

export default StepListScreen;