import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';

type RootStackParamList = {
  EditStageInfo: { stageTitle: string; stageAddress: string; stageArrivalDateTime: string; stageDepartureDateTime: string; stageNotes: string };
};

type Props = StackScreenProps<RootStackParamList, 'EditStageInfo'>;

export default function EditStageInfoScreen({ route, navigation }: Props) {
  const { stageTitle, stageAddress, stageArrivalDateTime, stageDepartureDateTime, stageNotes } = route.params;

  const [editableStageTitle, setEditableStageTitle] = useState(stageTitle);
  const [editableStageAddress, setEditableStageAddress] = useState(stageAddress);
  const [editableArrivalDateTime, setEditableArrivalDateTime] = useState(stageArrivalDateTime);
  const [editableDepartureDateTime, setEditableDepartureDateTime] = useState(stageDepartureDateTime);
  const [editableNotes, setEditableNotes] = useState(stageNotes);

  const handleSave = () => {
    // Implémentez la logique de sauvegarde ici
    console.log('Informations sauvegardées:', {
      editableStageTitle,
      editableStageAddress,
      editableArrivalDateTime,
      editableDepartureDateTime,
      editableNotes,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Éditer Infos Générales</Text>
      <TextInput
        label="Nom de l'étape"
        value={editableStageTitle}
        onChangeText={setEditableStageTitle}
        style={styles.input}
      />
      <TextInput
        label="Adresse"
        value={editableStageAddress}
        onChangeText={setEditableStageAddress}
        style={styles.input}
      />
      <TextInput
        label="Date et heure d'arrivée"
        value={editableArrivalDateTime}
        onChangeText={setEditableArrivalDateTime}
        style={styles.input}
      />
      <TextInput
        label="Date et heure de départ"
        value={editableDepartureDateTime}
        onChangeText={setEditableDepartureDateTime}
        style={styles.input}
      />
      <TextInput
        label="Notes"
        value={editableNotes}
        onChangeText={setEditableNotes}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
        Sauvegarder
      </Button>
    </View>
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
    marginBottom: 20,
  },
  input: {
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 20,
  },
});