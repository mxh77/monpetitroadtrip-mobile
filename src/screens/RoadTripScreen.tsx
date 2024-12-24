import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome'; // Importer les icônes

type RootStackParamList = {
    Home: undefined;
    Login: undefined;
    RoadTrips: undefined;
    RoadTrip: { roadtripId: string }; // Ajoutez cette route
};

type Props = StackScreenProps<RootStackParamList, 'RoadTrip'>;

type Stage = {
    _id: string;
    name: string;
    description: string;
    arrivalDateTime: string; // Ajoutez cette propriété
};

type Stop = {
    _id: string;
    name: string;
    description: string;
    arrivalDateTime: string; // Ajoutez cette propriété
};

type Roadtrip = {
    _id: string;
    userId: string;
    name: string;
    days: number;
    startLocation: string;
    startDate: string;
    startTime: string;
    endLocation: string;
    endDate: string;
    endTime: string;
    currency: string;
    notes: string;
    stages: Stage[];
    stops: Stop[];
};

export default function RoadTripScreen({ route }: Props) {
    const { roadtripId } = route.params;
    const [roadtrip, setRoadtrip] = useState<Roadtrip | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoadtrip = async () => {
            try {
                const response = await fetch(`https://mon-petit-roadtrip.vercel.app/roadtrips/${roadtripId}`);
                const data = await response.json();
                setRoadtrip(data);
            } catch (error) {
                console.error('Erreur lors de la récupération du roadtrip:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoadtrip();
    }, [roadtripId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    if (!roadtrip) {
        return (
            <View style={styles.container}>
                <Text>Erreur lors de la récupération du roadtrip.</Text>
            </View>
        );
    }

    // Combinez et triez les étapes et les arrêts par arrivalDateTime
    const combinedList = [...roadtrip.stages, ...roadtrip.stops].sort((a, b) =>
        new Date(a.arrivalDateTime).getTime() - new Date(b.arrivalDateTime).getTime()
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{roadtrip.name}</Text>
            <FlatList
                data={combinedList}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <View style={styles.itemHeader}>
                            <Icon
                                name={roadtrip.stages.some(stage => stage._id === item._id) ? 'bed' : 'flag'}
                                size={20}
                                color="#007BFF"
                                style={styles.itemIcon}
                            />
                            <Text style={styles.itemTitle}>{item.name}</Text>
                        </View>
                        <Text style={styles.itemDateTime}>
                            {new Date(item.arrivalDateTime).toLocaleString('fr-FR', {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        marginBottom: 16,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    item: {
        marginBottom: 16,
        //bordure pour les éléments
        borderWidth: 1,
        //arrondi
        borderRadius: 10,
        padding: 16,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemIcon: {
        marginRight: 8,
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    itemDescription: {
        fontSize: 16,
    },
    itemDateTime: {
        fontSize: 14,
        color: 'gray',
    },
});