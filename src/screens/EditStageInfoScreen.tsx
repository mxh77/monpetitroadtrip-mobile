import 'react-native-get-random-values'; // Importer react-native-get-random-values
import React, { useState, useLayoutEffect, useRef } from 'react';
import { StyleSheet, View, Text, Alert, FlatList } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { format, parseISO } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'; // Importer Google Places Autocomplete
import Constants from 'expo-constants';

type Props = StackScreenProps<RootStackParamList, 'EditStageInfo'>;

export default function EditStageInfoScreen({ route, navigation }: Props) {
    const { type, roadtripId, stageId, stageTitle, stageAddress, stageArrivalDateTime, stageDepartureDateTime, stageNotes, refresh } = route.params;

    const [editableStageTitle, setEditableStageTitle] = useState(stageTitle || '');
    const [editableStageAddress, setEditableStageAddress] = useState(stageAddress || '');
    const [editableArrivalDate, setEditableArrivalDate] = useState(stageArrivalDateTime ? parseISO(stageArrivalDateTime) : new Date());
    const [editableArrivalTime, setEditableArrivalTime] = useState(stageArrivalDateTime ? parseISO(stageArrivalDateTime) : new Date());
    const [editableDepartureDate, setEditableDepartureDate] = useState(stageDepartureDateTime ? parseISO(stageDepartureDateTime) : new Date());
    const [editableDepartureTime, setEditableDepartureTime] = useState(stageDepartureDateTime ? parseISO(stageDepartureDateTime) : new Date());
    const [editableNotes, setEditableNotes] = useState(stageNotes || '');

    const [showPicker, setShowPicker] = useState({ type: '', isVisible: false }); // Gestion unifiée des pickers

    const googlePlacesRef = useRef(null); // Référence pour GooglePlacesAutocomplete

    const validateFields = () => {
        if (!editableStageTitle.trim()) {
            Alert.alert('Erreur', "Le nom de l'étape est obligatoire.");
            return false;
        }
        if (!editableStageAddress.trim()) {
            Alert.alert('Erreur', "L'adresse est obligatoire.");
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateFields()) return;

        const isEdit = !!stageId;
        const url = isEdit
            ? type === 'stage'
                ? `https://mon-petit-roadtrip.vercel.app/stages/${stageId}`
                : `https://mon-petit-roadtrip.vercel.app/stops/${stageId}`
            : type === 'stage'
                ? `https://mon-petit-roadtrip.vercel.app/roadtrips/${roadtripId}/stages`
                : `https://mon-petit-roadtrip.vercel.app/roadtrips/${roadtripId}/stops`;

        const method = isEdit ? 'PUT' : 'POST';
        const payload = {
            name: editableStageTitle,
            address: editableStageAddress,
            arrivalDateTime: new Date(Date.UTC(
                editableArrivalDate.getUTCFullYear(),
                editableArrivalDate.getUTCMonth(),
                editableArrivalDate.getUTCDate(),
                editableArrivalTime.getUTCHours(),
                editableArrivalTime.getUTCMinutes()
            )).toISOString(),
            departureDateTime: new Date(Date.UTC(
                editableDepartureDate.getUTCFullYear(),
                editableDepartureDate.getUTCMonth(),
                editableDepartureDate.getUTCDate(),
                editableDepartureTime.getUTCHours(),
                editableDepartureTime.getUTCMinutes()
            )).toISOString(),
            notes: editableNotes,
        };

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const updatedData = await response.json();
                Alert.alert('Succès', 'Les informations ont été sauvegardées avec succès.');
                refresh(); // Actualise la liste des étapes
                navigation.goBack();
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Button
                    mode="text"
                    onPress={handleSave}
                    labelStyle={{ fontSize: 18 }}
                >
                    Enregistrer
                </Button>
            ),
        });
    }, [navigation, editableStageTitle, editableStageAddress, editableNotes]);

    const getTimeFromDate = (date: Date) =>
        `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;

    const handlePickerChange = (type: string, event: any, selectedDate?: Date) => {
        setShowPicker({ type: '', isVisible: false });
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            if (type === 'arrivalDate') setEditableArrivalDate(newDate);
            if (type === 'arrivalTime') setEditableArrivalTime(newDate);
            if (type === 'departureDate') setEditableDepartureDate(newDate);
            if (type === 'departureTime') setEditableDepartureTime(newDate);
        }
    };

    const renderItem = ({ item }: { item: string }) => {
        switch (item) {
            case 'stageTitle':
                return (
                    <TextInput
                        label="Nom de l'étape"
                        value={editableStageTitle}
                        onChangeText={setEditableStageTitle}
                        style={styles.input}
                    />
                );
            case 'stageAddress':
                return (
                    <View style={styles.inputContainer}>
                        <GooglePlacesAutocomplete
                            ref={googlePlacesRef}
                            placeholder="Adresse"
                            onPress={(data, details = null) => {
                                setEditableStageAddress(data.description);
                            }}
                            query={{
                                key: Constants.expoConfig?.extra?.GOOGLE_API_KEY,
                                language: 'fr',
                            }}
                            styles={{
                                textInputContainer: {
                                    backgroundColor: '#fff',
                                    borderTopWidth: 0,
                                    borderBottomWidth: 0,
                                },
                                textInput: {
                                    height: 38,
                                    color: '#5d5d5d',
                                    fontSize: 16,
                                },
                                predefinedPlacesDescription: {
                                    color: '#1faadb',
                                },
                            }}
                            textInputProps={{
                                value: editableStageAddress,
                                onChangeText: setEditableStageAddress,
                            }}
                            listViewDisplayed={false} // Masquer la liste après sélection
                        />
                    </View>
                );
            case 'arrivalDate':
                return (
                    <TextInput
                        label="Date d'arrivée"
                        value={format(editableArrivalDate, 'dd/MM/yyyy')}
                        onFocus={() => setShowPicker({ type: 'arrivalDate', isVisible: true })}
                        style={styles.input}
                    />
                );
            case 'arrivalTime':
                return (
                    <TextInput
                        label="Heure d'arrivée"
                        value={getTimeFromDate(editableArrivalTime)}
                        onFocus={() => setShowPicker({ type: 'arrivalTime', isVisible: true })}
                        style={styles.input}
                    />
                );
            case 'departureDate':
                return (
                    <TextInput
                        label="Date de départ"
                        value={format(editableDepartureDate, 'dd/MM/yyyy')}
                        onFocus={() => setShowPicker({ type: 'departureDate', isVisible: true })}
                        style={styles.input}
                    />
                );
            case 'departureTime':
                return (
                    <TextInput
                        label="Heure de départ"
                        value={getTimeFromDate(editableDepartureTime)}
                        onFocus={() => setShowPicker({ type: 'departureTime', isVisible: true })}
                        style={styles.input}
                    />
                );
            case 'notes':
                return (
                    <TextInput
                        label="Notes"
                        value={editableNotes}
                        onChangeText={setEditableNotes}
                        style={styles.input}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <FlatList
            data={['stageTitle', 'stageAddress', 'arrivalDate', 'arrivalTime', 'departureDate', 'departureTime', 'notes']}
            renderItem={renderItem}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="always"
        />
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#f9f9f9",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
    },
    input: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#fff',
    },
});