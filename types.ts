import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  RoadTrips: { refresh?: () => void };
  RoadTrip: { roadtripId: string };
  EditRoadTrip: { roadtripId?: string };
  Stage: {
    type: 'stage' | 'stop';
    roadtripId: string;
    stageId?: string;
    stageTitle?: string;
    stageAddress?: string;
    stageArrivalDateTime?: string;
    stageDepartureDateTime?: string;
    stageNotes?: string;
    stageCoordinates?: {
      latitude: number;
      longitude: number;
    };
    refresh?: () => void; // Ajout de la propriété refresh ici
    accommodations?: {
      longitude: any;
      latitude: any;
      name: string;
      address: string;
      website: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      arrivalDateTime: string;
      departureDateTime: string;
      thumbnail?: {
        url: string;
      };
    }[];
    activities?: {
      name: string;
      address: string;
      website: string;
      startDateTime: string;
      endDateTime: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      thumbnail?: {
        url: string;
      };
    }[];
  };
  EditStageInfo: {
    type: 'stage' | 'stop';
    roadtripId: string;
    stageId?: string;
    stageTitle?: string;
    stageAddress?: string;
    stageArrivalDateTime?: string;
    stageDepartureDateTime?: string;
    stageNotes?: string;
    refresh: () => void;
  };
  Accommodation: {
    name: string;
    address: string;
    website?: string;
    phone?: string;
    email?: string;
    reservationNumber?: string;
    confirmationDateTime?: string;
    arrivalDateTime: string;
    departureDateTime: string;
    nights?: number;
    price?: string;
    notes?: string;
  };
  WebView: { url: string };
  Maps: undefined;
};

// Types pour les props de navigation et de route
export type StageScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Stage'>;
export type StageScreenRouteProp = RouteProp<RootStackParamList, 'Stage'>;

export type EditStageInfoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditStageInfo'>;
export type EditStageInfoScreenRouteProp = RouteProp<RootStackParamList, 'EditStageInfo'>;

export type AccommodationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Accommodation'>;
export type AccommodationScreenRouteProp = RouteProp<RootStackParamList, 'Accommodation'>;

//Gérer les props de navigation et de route de MapsScreen
export type MapsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Maps'>;
export type MapsScreenRouteProp = RouteProp<RootStackParamList, 'Maps'>;

export type StageScreenProps = {
  navigation: StageScreenNavigationProp;
  route: StageScreenRouteProp;
};

export type EditStageInfoScreenProps = {
  navigation: EditStageInfoScreenNavigationProp;
  route: EditStageInfoScreenRouteProp;
};

export type AccommodationScreenProps = {
  navigation: AccommodationScreenNavigationProp;
  route: AccommodationScreenRouteProp;
};