import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RoadTripsScreen from './src/screens/RoadTripsScreen'; // Assurez-vous que le nom du fichier est correct
import RoadTripScreen from './src/screens/RoadTripScreen';
import EditRoadTripScreen from './src/screens/EditRoadTripScreen';
import StageScreen from './src/screens/StageScreen';
import EditStageInfoScreen from './src/screens/EditStageInfoScreen';
import AccommodationScreen from './src/screens/AccommodationScreen';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Importer l'icône

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  RoadTrips: { refresh?: () => void };
  RoadTrip: { roadtripId: string };
  EditRoadTrip: { roadtripId?: string };
  Stage: undefined;
  EditStageInfo: undefined;
  Accommodation: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Se connecter' }} />
        <Stack.Screen
          name="RoadTrips"
          component={RoadTripsScreen}
          options={({ navigation, route }) => ({
            headerTitle: 'MES ROADTRIPS',
            headerTitleAlign: 'center', // Centrer le titre
            headerRight: () => (
              <Icon
                name="logout"
                size={24}
                color="#007BFF"
                onPress={() => navigation.navigate('Home')}
                style={{ marginRight: 16 }}
              />
            ),
            headerLeft: () => (
              <Icon
                name="refresh"
                size={24}
                color="#007BFF"
                onPress={() => {
                  if (route.params?.refresh) {
                    route.params.refresh();
                  }
                }}
                style={{ marginLeft: 16 }}
              />
            ),
          })}
        />
        <Stack.Screen name="RoadTrip" component={RoadTripScreen} options={{ title: 'Mes RoadTrips' }} />
        <Stack.Screen name="EditRoadTrip" component={EditRoadTripScreen} options={{ title: 'Modifier le RoadTrip' }} />
        <Stack.Screen name="Stage" component={StageScreen} options={{ title: 'Liste des étapes' }} />
        <Stack.Screen name="EditStageInfo" component={EditStageInfoScreen} options={{ title: 'Etape' }} />
        <Stack.Screen name="Accommodation" component={AccommodationScreen} options={{ title: 'Etape' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}