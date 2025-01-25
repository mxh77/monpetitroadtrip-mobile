import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, SectionList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, RadioButton } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { format, parseISO } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { formatDateTimeUTC2Digits, formatDateJJMMAA } from '../utils/dateUtils';
import RadioGroup from 'react-native-radio-buttons-group';
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

type Props = StackScreenProps<RootStackParamList, 'CreateStep'>;

export default function CreateStepScreen({ route, navigation }: Props) {
    const { roadtripId } = route.params;
    const [stepType, setStepType] = useState('1'); // 'stage' or 'stop'
    const [addressInput, setAddressInput] = useState('');
    const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });
    const [pickerDate, setPickerDate] = useState(new Date());
    const [tempDate, setTempDate] = useState(new Date());

    const [formState, setFormState] = useState({
        title: '',
        address: '',
        arrivalDate: new Date(),
        arrivalTime: new Date(),
        departureDate: new Date(),
        departureTime: new Date(),
        notes: '',
    });

    const googlePlacesRef = useRef(null);

    const handleSave = async () => {
        if (!formState.address) {
            Alert.alert('Erreur', 'L\'adresse est obligatoire.');
            return;
        }

        const urlStage = `https://mon-petit-roadtrip.vercel.app/roadtrips/${roadtripId}/stages`;
        const urlStop = `https://mon-petit-roadtrip.vercel.app/roadtrips/${roadtripId}/stops`;
        const url = stepType === '1' ? urlStage : urlStop;
        const payload = {
            name: formState.title,
            address: formState.address,
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

        console.log('Payload:', JSON.stringify(payload));

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const updatedData = await response.json();
                console.log('Succès', 'Les informations ont été sauvegardées avec succès.');
                Alert.alert('Succès', 'Les informations ont été sauvegardées avec succès.');
                navigation.goBack();
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
        }
    };

    useEffect(() => {
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

    useEffect(() => {
        if (addressInput !== formState.address) {
            console.log('Updating formState.address ', formState.address, 'with addressInput:', addressInput);
            setFormState((prevState) => ({ ...prevState, address: addressInput }));
        }
    }, [addressInput, formState.address]);

    useEffect(() => {
        console.log('stepType:', stepType);
    }, [stepType]);

    const getTimeFromDate = (date: Date) =>
        `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;

    const handlePickerChange = (type: string, event: any, selectedDate?: Date) => {
        if (event.type === 'dismissed') {
            setShowPicker({ type: '', isVisible: false });
            return;
        }
        setShowPicker({ type: '', isVisible: false });
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            if (type === 'arrivalDate') setFormState((prevState) => ({ ...prevState, arrivalDate: newDate }));
            if (type === 'arrivalTime') setFormState((prevState) => ({ ...prevState, arrivalTime: newDate }));
            if (type === 'departureDate') setFormState((prevState) => ({ ...prevState, departureDate: newDate }));
            if (type === 'departureTime') setFormState((prevState) => ({ ...prevState, departureTime: newDate }));
        }
    };

    const openPicker = (type: string) => {
        let date;
        switch (type) {
            case 'arrivalDate':
                date = new Date(Date.UTC(
                    formState.arrivalDate.getUTCFullYear(),
                    formState.arrivalDate.getUTCMonth(),
                    formState.arrivalDate.getUTCDate()
                ));
                break;
            case 'arrivalTime':
                date = new Date(Date.UTC(
                    formState.arrivalTime.getUTCFullYear(),
                    formState.arrivalTime.getUTCMonth(),
                    formState.arrivalTime.getUTCDate(),
                    formState.arrivalTime.getUTCHours(),
                    formState.arrivalTime.getUTCMinutes()
                ));
                break;
            case 'departureDate':
                date = new Date(Date.UTC(
                    formState.departureDate.getUTCFullYear(),
                    formState.departureDate.getUTCMonth(),
                    formState.departureDate.getUTCDate()
                ));
                break;
            case 'departureTime':
                date = new Date(Date.UTC(
                    formState.departureTime.getUTCFullYear(),
                    formState.departureTime.getUTCMonth(),
                    formState.departureTime.getUTCDate(),
                    formState.departureTime.getUTCHours(),
                    formState.departureTime.getUTCMinutes()
                ));
                break;
            default:
                date = new Date();
        }
        setPickerDate(date);
        setTempDate(date);
        setShowPicker({ type, isVisible: true });
    };

    const renderInputField = (field: string) => {
        switch (field) {
            case 'stepTitle':
                return (
                    <TextInput
                        label="Nom de l'étape"
                        value={formState.title}
                        onChangeText={(text) => setFormState((prevState) => ({ ...prevState, title: text }))}
                        style={styles.input}
                    />
                );
            case 'stepAddress':
                return (
                    <View style={styles.input}>
                        <GooglePlacesAutocomplete
                            ref={googlePlacesRef}
                            placeholder="Adresse"
                            onPress={(data, details = null) => {
                                console.log('Address selected:', data.description);
                                setAddressInput(data.description);
                            }}
                            query={{
                                key: GOOGLE_API_KEY,
                                language: 'fr',
                            }}
                            textInputProps={{
                                value: addressInput,
                                onChangeText: (text) => {
                                    console.log("onChangeText (text:", text, "addressInput:", addressInput, "formState.address:", formState.address, ")");
                                    if (text !== "" || (text === "" && addressInput !== formState.address)) {
                                        console.log('Setting addressInput to:', text, " / addressInput:", addressInput, " / formState.address:", formState.address, ")");
                                        setAddressInput(text);
                                    }
                                },
                            }}
                            listViewDisplayed={false}
                            fetchDetails={true}
                            enablePoweredByContainer={false}
                            styles={{
                                textInputContainer: {
                                    backgroundColor: 'rgba(0,0,0,0)',
                                    borderTopWidth: 0,
                                    borderBottomWidth: 0,
                                },
                                textInput: {
                                    marginLeft: 0,
                                    marginRight: 0,
                                    height: 38,
                                    color: '#5d5d5d',
                                    fontSize: 16,
                                },
                                predefinedPlacesDescription: {
                                    color: '#1faadb',
                                },
                            }}
                            renderRightButton={() => (
                                <TouchableOpacity onPress={() => {
                                    setAddressInput('');
                                }}>
                                    <Icon name="times-circle" size={20} color="gray" style={styles.clearIcon} />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                );
            case 'arrivalDate':
                return (
                    <TextInput
                        label="Date d'arrivée"
                        value={format(formState.arrivalDate, 'dd/MM/yyyy')}
                        onFocus={() => openPicker('arrivalDate')}
                        style={styles.input}
                    />
                );
            case 'arrivalTime':
                return (
                    <TextInput
                        label="Heure d'arrivée"
                        value={getTimeFromDate(formState.arrivalTime)}
                        onFocus={() => openPicker('arrivalTime')}
                        style={styles.input}
                    />
                );
            case 'departureDate':
                return (
                    <TextInput
                        label="Date de départ"
                        value={format(formState.departureDate, 'dd/MM/yyyy')}
                        onFocus={() => openPicker('departureDate')}
                        style={styles.input}
                    />
                );
            case 'departureTime':
                return (
                    <TextInput
                        label="Heure de départ"
                        value={getTimeFromDate(formState.departureTime)}
                        onFocus={() => openPicker('departureTime')}
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
            <View style={styles.radioContainer}>
                <RadioGroup radioButtons={[
                    { id: '1', label: 'Étape', value: 'stage', size: 24 },
                    { id: '2', label: 'Arrêt', value: 'stop', size: 24 }]}
                    layout='row'
                    onPress={setStepType}
                    selectedId={stepType}
                />
            </View>
            <SectionList
                sections={[
                    { title: 'Informations ', data: ['stepTitle', 'stepAddress'] },
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
                    value={pickerDate}
                    mode={showPicker.type.includes('Time') ? 'time' : 'date'}
                    display="default"
                    timeZoneName='UTC'
                    onChange={(event, selectedDate) => {
                        if (event.type === 'set' && selectedDate) {
                            handlePickerChange(showPicker.type, event, selectedDate);
                        } else {
                            setPickerDate(tempDate); // Reset to the original date if cancelled
                        }
                    }}
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
    radioContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center', // Ajoutez cette ligne pour centrer verticalement
        marginBottom: 20,
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
    },
});