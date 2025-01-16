import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Alert, SectionList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { format, parseISO } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/FontAwesome';

const GOOGLE_API_KEY = 'AIzaSyBYC-Mamm9LrqrbBPR7jcZ1ZnnwWiRIXQw';

type Props = StackScreenProps<RootStackParamList, 'EditStageInfo'>;

export default function EditStageInfoScreen({ route, navigation }: Props) {
    const { type, roadtripId, stageId, stageTitle, stageAddress, stageArrivalDateTime, stageDepartureDateTime, stageNotes, refresh } = route.params;

    const [formState, setFormState] = useState({
        title: stageTitle || '',
        address: stageAddress || '',
        arrivalDate: stageArrivalDateTime ? parseISO(stageArrivalDateTime) : new Date(),
        arrivalTime: stageArrivalDateTime ? parseISO(stageArrivalDateTime) : new Date(),
        departureDate: stageDepartureDateTime ? parseISO(stageDepartureDateTime) : new Date(),
        departureTime: stageDepartureDateTime ? parseISO(stageDepartureDateTime) : new Date(),
        notes: stageNotes || ''
    });

    const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });

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
            name: formState.title,
            arrivalDateTime: new Date(Date.UTC(
                formState.arrivalDate.getUTCFullYear(),
                formState.arrivalDate.getUTCMonth(),
                formState.arrivalDate.getUTCDate(),
                formState.arrivalTime.getUTCHours(),
                formState.arrivalTime.getUTCMinutes()
            )).toISOString(),
            departureDateTime: new Date(Date.UTC(
                formState.departureDate.getUTCFullYear(),
                formState.departureDate.getUTCMonth(),
                formState.departureDate.getUTCDate(),
                formState.departureTime.getUTCHours(),
                formState.departureTime.getUTCMinutes()
            )).toISOString(),
            notes: formState.notes,
        };

        console.log('Méthode:', method);
        console.log('Payload:', JSON.stringify(payload));

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const updatedData = await response.json();
                Alert.alert('Succès', 'Les informations ont été sauvegardées avec succès.');
                refresh();
                navigation.goBack();
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
        }
    };

    React.useEffect(() => {
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
    }, [navigation, handleSave]);

    const getTimeFromDate = (date: Date) =>
        `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;

    const handlePickerChange = (type: string, event: any, selectedDate?: Date) => {
        setShowPicker({ type: '', isVisible: false });
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            if (type === 'arrivalDate') setFormState((prevState) => ({ ...prevState, arrivalDate: newDate }));
            if (type === 'arrivalTime') setFormState((prevState) => ({ ...prevState, arrivalTime: newDate }));
            if (type === 'departureDate') setFormState((prevState) => ({ ...prevState, departureDate: newDate }));
            if (type === 'departureTime') setFormState((prevState) => ({ ...prevState, departureTime: newDate }));
        }
    };

    const renderInputField = (field: string) => {
        switch (field) {
            case 'stageTitle':
                return (
                    <TextInput
                        label="Nom de l'étape"
                        value={formState.title}
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, title: text }))}
                        style={styles.input}
                    />
                );
            case 'stageAddress':
                return (
                    <TextInput
                        label="Adresse"
                        value={formState.address}
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, address: text }))}
                        style={styles.input}
                    />
                );

            case 'arrivalDate':
                return (
                    <TextInput
                        label="Date d'arrivée"
                        value={format(formState.arrivalDate, 'dd/MM/yyyy')}
                        onFocus={() => setShowPicker({ type: 'arrivalDate', isVisible: true })}
                        style={styles.input}
                    />
                );
            case 'arrivalTime':
                return (
                    <TextInput
                        label="Heure d'arrivée"
                        value={getTimeFromDate(formState.arrivalTime)}
                        onFocus={() => setShowPicker({ type: 'arrivalTime', isVisible: true })}
                        style={styles.input}
                    />
                );
            case 'departureDate':
                return (
                    <TextInput
                        label="Date de départ"
                        value={format(formState.departureDate, 'dd/MM/yyyy')}
                        onFocus={() => setShowPicker({ type: 'departureDate', isVisible: true })}
                        style={styles.input}
                    />
                );
            case 'departureTime':
                return (
                    <TextInput
                        label="Heure de départ"
                        value={getTimeFromDate(formState.departureTime)}
                        onFocus={() => setShowPicker({ type: 'departureTime', isVisible: true })}
                        style={styles.input}
                    />
                );
            case 'notes':
                return (
                    <TextInput
                        label="Notes"
                        value={formState.notes}
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, notes: text }))}
                        style={[styles.input, styles.notesInput]}
                        multiline
                        numberOfLines={4}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <SectionList
                sections={[
                    { title: 'Informations de l\'étape', data: ['stageTitle', 'stageAddress'] },
                    { title: 'Dates et heures', data: ['arrivalDate', 'arrivalTime', 'departureDate', 'departureTime'] },
                    { title: 'Notes', data: ['notes'] },
                ]}
                renderItem={({ item }) => <View key={item}>{renderInputField(item)}</View>}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionTitle}>{title}</Text>
                )}
            />
            {showPicker.isVisible && (
                <DateTimePicker
                    value={new Date()}
                    mode={showPicker.type.includes('Time') ? 'time' : 'date'}
                    display="default"
                    onChange={(event, selectedDate) => handlePickerChange(showPicker.type, event, selectedDate)}
                />
            )}
        </KeyboardAvoidingView>
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
    notesInput: {
        height: 100,
    },
    clearIcon: {
        marginRight: 10,
        marginTop: 10,
    },
});