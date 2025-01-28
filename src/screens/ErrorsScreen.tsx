import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';

type Props = StackScreenProps<RootStackParamList, 'Errors'>;

const ErrorsScreen = ({ route, navigation }: Props) => {
  const {roadtripId, errors} = route.params;

 //Retourner une vue avec une liste d'erreurs et un lien vers la page stage ou stop lorsque l'utilisateur clique sur une erreur
    return (
        <View style={styles.container}>
        <Text style={styles.title}>Erreurs de cohérence des dates</Text>
        <FlatList
            data={errors}
            renderItem={({ item }) => (
            <TouchableOpacity
                style={styles.errorItem}
                onPress={() => {
                if (item.stepType === 'stage') {
                   console.log('item.stepId', item.stepId);
                    navigation.navigate('Stage', {type:'stage', roadtripId: roadtripId, stepId: item.stepId, refresh: () => {} });
                } else {
                    navigation.navigate('Stop', { type:'stop', roadtripId: roadtripId, stepId: item.stepId, refresh: () => {} });
                }
                }}
            >
                <Text style={styles.errorText}>{item.message}</Text>
            </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
        />
        </View>
    );
};

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
    fontWeight: 'bold',
  },
  errorItem: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
});

export default ErrorsScreen;