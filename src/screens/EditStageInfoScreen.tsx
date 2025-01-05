import React, { useState, useLayoutEffect } from 'react';
import { StyleSheet, View, Text, Alert, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { format, parseISO } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

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

    const [showArrivalDatePicker, setShowArrivalDatePicker] = useState(false);
    const [showArrivalTimePicker, setShowArrivalTimePicker] = useState(false);
    const [showDepartureDatePicker, setShowDepartureDatePicker] = useState(false);
    const [showDepartureTimePicker, setShowDepartureTimePicker] = useState(false);

    const handleSave = async () => {
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
            )).toISOString().replace('Z', ''),
            notes: editableNotes,
        };

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const updatedData = await response.json();
                Alert.alert('Succès', 'Les informations ont été sauvegardées avec succès.');
                navigation.navigate('Stage', {
                    ...route.params,
                    stageTitle: updatedData.name,
                    stageAddress: updatedData.address,
                    stageArrivalDateTime: updatedData.arrivalDateTime,
                    stageDepartureDateTime: updatedData.departureDateTime,
                    stageNotes: updatedData.notes,
                });
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde des informations.');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des informations:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde des informations.');
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Button
                    mode="text"
                    onPress={handleSave}
                    labelStyle={{ fontSize: 18 }} // Augmentez la taille de la police ici
                >
                    Enregistrer
                </Button>
            ),
        });
    }, [navigation, editableStageTitle, editableStageAddress, editableArrivalDate, editableArrivalTime, editableDepartureDate, editableDepartureTime, editableNotes]);

    //Fonction qui récupère HH:mm d'un dateTime sans tenir compte du fuseau horaire
    const getTimeFromDate = (date: Date) => {
        return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
    }

    // Convertir une chaîne "HH:mm" en Date pour DateTimePicker
    const stringToTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0); // Ignore les fuseaux horaires
        return date;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{stageId ? 'Éditer Infos Générales' : 'Créer Infos Générales'}</Text>
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
                label="Date d'arrivée"
                value={format(editableArrivalDate, 'dd/MM/yyyy')}
                onFocus={() => setShowArrivalDatePicker(true)}
                style={styles.input}
            />
            {showArrivalDatePicker && (
                <DateTimePicker
                    value={editableArrivalDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowArrivalDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                            const newDate = new Date(editableArrivalDate);
                            newDate.setUTCFullYear(selectedDate.getFullYear());
                            newDate.setUTCMonth(selectedDate.getMonth());
                            newDate.setUTCDate(selectedDate.getDate());
                            setEditableArrivalDate(newDate);
                        }
                    }}
                />
            )}
            <TextInput
                label="Heure d'arrivée"
                //value={`${editableArrivalTime.getUTCHours().toString().padStart(2, '0')}:${editableArrivalTime.getUTCMinutes().toString().padStart(2, '0')}`}
                value={getTimeFromDate(editableArrivalTime)}
                onFocus={() => setShowArrivalTimePicker(true)}
                style={styles.input}
            />
            {showArrivalTimePicker && (
                <DateTimePicker
                    value={stringToTime(getTimeFromDate(editableArrivalTime))} // Initialise avec l'heure "locale"
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                        setShowArrivalTimePicker(Platform.OS === 'ios');
                        if (selectedTime) {
                            const newTime = new Date(editableArrivalTime);
                            newTime.setUTCHours(selectedTime.getHours());
                            newTime.setUTCMinutes(selectedTime.getMinutes());
                            setEditableArrivalTime(newTime);
                        }
                    }}
                />
            )}
            <TextInput
                label="Date de départ"
                value={format(editableDepartureDate, 'dd/MM/yyyy')}
                onFocus={() => setShowDepartureDatePicker(true)}
                style={styles.input}
            />
            {showDepartureDatePicker && (
                <DateTimePicker
                    value={editableDepartureDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowDepartureDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                            const newDate = new Date(editableDepartureDate);
                            newDate.setUTCFullYear(selectedDate.getFullYear());
                            newDate.setUTCMonth(selectedDate.getMonth());
                            newDate.setUTCDate(selectedDate.getDate());
                            setEditableDepartureDate(newDate);
                        }
                    }}
                />
            )}
            <TextInput
                label="Heure de départ"
                value={getTimeFromDate(editableDepartureTime)}
                onFocus={() => setShowDepartureTimePicker(true)}
                style={styles.input}
            />
            {showDepartureTimePicker && (
                <DateTimePicker
                value={stringToTime(getTimeFromDate(editableDepartureTime))} // Initialise avec l'heure "locale"
                mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                        setShowDepartureTimePicker(Platform.OS === 'ios');
                        if (selectedTime) {
                            const newTime = new Date(editableDepartureTime);
                            newTime.setUTCHours(selectedTime.getHours());
                            newTime.setUTCMinutes(selectedTime.getMinutes());
                            setEditableDepartureTime(newTime);
                        }
                    }}
                />
            )}
            <TextInput
                label="Notes"
                value={editableNotes}
                onChangeText={setEditableNotes}
                style={styles.input}
            />
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
});