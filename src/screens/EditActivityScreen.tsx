import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, SectionList, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Activity } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { formatDateTimeUTC2Digits, formatDateJJMMAA, getTimeFromDate, formatTimeHHMM } from '../utils/dateUtils';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { format, parseISO, set } from 'date-fns';
import Fontawesome5 from 'react-native-vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';

type Props = StackScreenProps<RootStackParamList, 'EditActivity'>;
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.apiKey || '';

export default function EditActivityScreen({ route, navigation }: Props) {
  const { activity, refresh } = route.params;
console.log('Activity:', activity);
  const [isEditing, setIsEditing] = useState(true);
  const [thumbnail, setThumbnail] = useState(activity.thumbnail ? { uri: activity.thumbnail.url } : null);

  const [addressInput, setAddressInput] = useState(activity.address || '');
  const [showPicker, setShowPicker] = useState({ type: '', isVisible: false });
  const [pickerDate, setPickerDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());

  const [formState, setFormState] = useState<Activity>({
    _id: activity._id,
    name: activity.name || '',
    address: activity.address || '',
    website: activity.website || '',
    phone: activity.phone || '',
    email: activity.email || '',
    reservationNumber: activity.reservationNumber || '',
    confirmationDateTime: activity.confirmationDateTime || '',
    startDateTime: activity.startDateTime || '',
    endDateTime: activity.endDateTime || '',
    price: activity.price || '0',
    notes: activity.notes || '',
    thumbnail: activity.thumbnail,
  });

  const [formConfirmationDate, setFormConfirmationDate] = useState(new Date());
  const [formStartDate, setFormStartDate] = useState(new Date());
  const [formStartTime, setFormStartTime] = useState(new Date());
  const [formEndDate, setFormEndDate] = useState(new Date());
  const [formEndTime, setFormEndTime] = useState(new Date());

  const googlePlacesRef = useRef(null);

  const handleSave = async () => {
    console.log('Activity ID:', activity._id);
    const url = `https://mon-petit-roadtrip.vercel.app/activities/${activity._id}`;
    console.log('formState:', formState);
    const payload = {
      ...formState,
      confirmationDateTime: formConfirmationDate.toISOString(),
      startDateTime: new Date(Date.UTC(
        formStartDate.getUTCFullYear(),
        formStartDate.getUTCMonth(),
        formStartDate.getUTCDate(),
        formStartTime.getUTCHours(),
        formStartTime.getUTCMinutes()
      )).toISOString(),
      endDateTime: new Date(Date.UTC(
        formEndDate.getUTCFullYear(),
        formEndDate.getUTCMonth(),
        formEndDate.getUTCDate(),
        formEndTime.getUTCHours(),
        formEndTime.getUTCMinutes())
      ).toISOString()
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
  }, [navigation, handleSave]);

  useEffect(() => {
    if (formState.confirmationDateTime) {
      setFormConfirmationDate(parseISO(formState.confirmationDateTime));
    }
    if (formState.startDateTime) {
      setFormStartDate(parseISO(formState.startDateTime));
      setFormStartTime(parseISO(formState.startDateTime));
    }
    if (formState.endDateTime) {
      setFormEndDate(parseISO(formState.endDateTime));
      setFormEndTime(parseISO(formState.endDateTime));
    }
  }, [formState.confirmationDateTime, formState.startDateTime, formState.endDateTime]);

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
      if (type === 'confirmationDate') {
        setFormConfirmationDate(newDate);
      }
      if (type === 'startDate') {
        setFormStartDate(newDate);
      }
      if (type === 'startTime') {
        setFormStartTime(newDate);
      }
      if (type === 'endDate') {
        setFormEndDate(newDate);
      }
      if (type === 'endTime') {
        setFormEndTime(newDate);
      }

    }
  };

  const openPicker = (type: string) => {
    let date;
    switch (type) {
      case 'confirmationDate':
        console.log('formConfirmationDate:', formConfirmationDate);
        date = new Date(Date.UTC(
          formConfirmationDate.getUTCFullYear(),
          formConfirmationDate.getUTCMonth(),
          formConfirmationDate.getUTCDate()
        ));
        break;
      case 'startDate':
        console.log('formStartDate:', formStartDate);
        date = new Date(Date.UTC(
          formStartDate.getUTCFullYear(),
          formStartDate.getUTCMonth(),
          formStartDate.getUTCDate()
        ));
        break;
      case 'startTime':
        date = new Date(Date.UTC(
          formStartTime.getUTCFullYear(),
          formStartTime.getUTCMonth(),
          formStartTime.getUTCDate(),
          formStartTime.getUTCHours(),
          formStartTime.getUTCMinutes()
        ));
        break;
      case 'endDate':
        date = new Date(Date.UTC(
          formEndDate.getUTCFullYear(),
          formEndDate.getUTCMonth(),
          formEndDate.getUTCDate()
        ));
        break;
      case 'endTime':
        date = new Date(Date.UTC(
          formEndTime.getUTCFullYear(),
          formEndTime.getUTCMonth(),
          formEndTime.getUTCDate(),
          formEndTime.getUTCHours(),
          formEndTime.getUTCMinutes()
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
            label="Nom de l'activité"
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
            value={formConfirmationDate ? format(formConfirmationDate, 'dd/MM/yyyy') : ''}
            onFocus={() => openPicker('confirmationDate')}
            style={styles.input}
          />
        );
      case 'startDateTime':
        return (
          <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
              <TextInput
                label="Date de début"
                value={format(formStartDate, 'dd/MM/yyyy')}
                onFocus={() => openPicker('startDate')}
                style={styles.input}
              />
            </View>
            <View style={styles.rowItem}>
              <TextInput
                label="Heure de début"
                value={getTimeFromDate(new Date(formStartTime))}
                onFocus={() => openPicker('startTime')}
                style={styles.input}
              />
            </View>
          </View>
        );
      case 'endDateTime':
        return (
          <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
              <TextInput
                label="Date de fin"
                value={format(formEndDate, 'dd/MM/yyyy')}
                onFocus={() => openPicker('endDate')}
                style={styles.input}
              />
            </View>
            <View style={styles.rowItem}>
              <TextInput
                label="Heure de fin"
                value={getTimeFromDate(new Date(formEndTime))}
                onFocus={() => openPicker('endTime')}
                style={styles.input}
              />
            </View>
          </View>
        );
      case 'price':
        return (
          <TextInput
            label="Prix"
            value={formState.price? formState.price.toString() : '0'}
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
          { title: 'Dates d\'activité', data: ['startDateTime', 'endDateTime'] },
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
              console.log('Selected date:', selectedDate);
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
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  thumbnail: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  changeThumbnailText: {
    marginTop: 10,
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
});