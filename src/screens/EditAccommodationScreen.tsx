import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, SectionList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { formatDateTimeUTC2Digits, formatDateJJMMAA, getTimeFromDate, formatTimeHHMM } from '../utils/dateUtils';
import Constants from 'expo-constants';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { format, parseISO } from 'date-fns';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';

type Props = StackScreenProps<RootStackParamList, 'EditAccommodation'>;
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

export default function AccommodationScreen({ route, navigation }: Props) {
  const { accommodation, refresh } = route.params;
  console.log('Accommodation ID:', accommodation._id);

  const [isEditing, setIsEditing] = useState(true);

  const [addressInput, setAddressInput] = useState(accommodation.address || '');
  const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });
  const [pickerDate, setPickerDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());

  const [formState, setFormState] = useState({
    name: accommodation.name || ''  ,
    address: accommodation.address,
    website: accommodation.website,
    phone: accommodation.phone,
    email: accommodation.email,
    reservationNumber: accommodation.reservationNumber,
    confirmationDateTime: accommodation.confirmationDateTime,
    arrivalDate: parseISO(accommodation.arrivalDateTime) || new Date(),
    arrivalTime: parseISO(accommodation.arrivalDateTime) || new Date(),
    departureDate: parseISO(accommodation.departureDateTime) || new Date(),
    departureTime: parseISO(accommodation.departureDateTime) || new Date(),
    nights: accommodation.nights,
    price: accommodation.price,
    notes: accommodation.notes,

  });

  console.log('formState:', formState);

  const googlePlacesRef = useRef(null);

  const handleSave = async () => {
    console.log('Accommodation ID:', accommodation._id);
    const url = `https://mon-petit-roadtrip.vercel.app/accommodations/${accommodation._id}`;
    console.log('formState:', formState);
    const payload = {
      name: formState.name,
      address: formState.address,
      website: formState.website,
      phone: formState.phone,
      email: formState.email,
      reservationNumber: formState.reservationNumber,
      confirmationDateTime: formState.confirmationDateTime,
      arrivalDateTime: new Date(Date.UTC(
        formState.arrivalDate.getUTCFullYear(),
        formState.arrivalDate.getUTCMonth(),
        formState.arrivalDate.getUTCDate(),
        formState.arrivalTime.getUTCHours(),
        formState.arrivalTime.getUTCMinutes()
      )),
      departureDateTime: new Date(Date.UTC(
        formState.departureDate.getUTCFullYear(),
        formState.departureDate.getUTCMonth(),
        formState.departureDate.getUTCDate(),
        formState.departureTime.getUTCHours(),
        formState.departureTime.getUTCMinutes()
      )),
      nights: formState.nights,
      price: formState.price,
      notes: formState.notes,
    };

    console.log('Payload:', JSON.stringify(payload));

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedData = await response.json();
        console.log('Succès', 'Les informations ont été sauvegardées avec succès.');
        Alert.alert('Succès', 'Les informations ont été sauvegardées avec succès.');
        if (refresh) {
          refresh();
        }

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
        <TouchableOpacity onPress={handleSave} style={{ padding: 10, marginRight: 10 }}>
          <Fontawesome5 name="save" size={30} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation,handleSave]);

  useEffect(() => {
    if (addressInput !== formState.address) {
      console.log('Updating formState.address ', formState.address, 'with addressInput:', addressInput);
      setFormState((prevState) => ({ ...prevState, address: addressInput }));
    }
  }, [addressInput, formState.address]);

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
      case 'name':
        return (
          <TextInput
            label="Nom de l'étape"
            value={formState.name}
            onChangeText={(text) => setFormState((prevState) => ({ ...prevState, name: text }))}
            style={styles.input}
          />
        );
      case 'address':
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
      case 'website':
        return (
          <TextInput
            label="Site Web"
            value={formState.website}
            onChangeText={(text) => setFormState((prevState) => ({ ...prevState, website: text }))}
            style={styles.input}
          />
        );
      case 'phone':
        return (
          <TextInput
            label="Téléphone"
            value={formState.phone}
            onChangeText={(text) => setFormState((prevState) => ({ ...prevState, phone: text }))}
            style={styles.input}
          />
        );
      case 'email':
        return (
          <TextInput
            label="Mail"
            value={formState.email}
            onChangeText={(text) => setFormState((prevState) => ({ ...prevState, email: text }))}
            style={styles.input}
          />
        );
      case 'reservationNumber':
        return (
          <TextInput
            label="N° Réservation"
            value={formState.reservationNumber}
            onChangeText={(text) => setFormState((prevState) => ({ ...prevState, reservationNumber: text }))}
            style={styles.input}
          />
        );
      case 'confirmationDateTime':
        return (
          <TextInput
            label="Date de confirmation"
            value={format(formState.arrivalDate, 'dd/MM/yyyy')}
            onFocus={() => openPicker('arrivalDate')}
            style={styles.input}
          />
        );
      case 'arrivalDateTime':
        return (
          <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
              <TextInput
                label="Date d'arrivée"
                value={format(formState.arrivalDate, 'dd/MM/yyyy')}
                onFocus={() => openPicker('arrivalDate')}
                style={styles.input}
              />
            </View>
            <View style={styles.rowItem}>
              <TextInput
                label="Heure d'arrivée"
                value={getTimeFromDate(formState.arrivalTime)}
                onFocus={() => openPicker('arrivalTime')}
                style={styles.input}
              />
            </View>
          </View>

        );
      case 'departureDateTime':
        return (
          <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
              <TextInput
                label="Date de départ"
                value={format(formState.departureDate, 'dd/MM/yyyy')}
                onFocus={() => openPicker('departureDate')}
                style={styles.input}
              />
            </View>
            <View style={styles.rowItem}>
              <TextInput
                label="Heure de départ"
                value={getTimeFromDate(formState.departureTime)}
                onFocus={() => openPicker('departureTime')}
                style={styles.input}
              />
            </View>
          </View>
        );
      case 'nights':
        return (
          <TextInput
            label="Nombre de nuits"
            value={formState.nights ? formState.nights.toString() : '0'}
            onChangeText={(text) => setFormState((prevState) => ({ ...prevState, nights: parseInt(text, 10) || 0 }))}
            style={styles.input}
          />
        );
      case 'price':
        return (
          <TextInput
            label="Prix"
            value={formState.price}
            onChangeText={(text) => setFormState((prevState) => ({ ...prevState, price: text }))}
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
          { title: 'Informations Générales', data: ['name', 'address', 'website', 'phone', 'email'] },
          { title: 'Réservation', data: ['reservationNumber', 'confirmationDateTime'] },
          { title: 'Dates de séjour', data: ['arrivalDateTime', 'departureDateTime', 'nights'] },
          { title: 'Autres informations', data: ['price', 'notes'] },
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowItem: {
    flex: 1,
    marginRight: 10,
  },
  input: {
    flex: 1,
    marginBottom: 10,
    padding: 5,
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