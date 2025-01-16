import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const MapScreen = () => {
    const [mapKey, setMapKey] = useState(Math.random().toString());
    const mapViewRef = useRef<MapView>(null);
    const [markers, setMarkers] = useState([
        { latitude: 48.8566, longitude: 2.3522, title: "Paris", description: "This is Paris" },
        { latitude: 48.8566, longitude: 2.3622, title: "Marker 2", description: "This is another marker" },
        { latitude: 48.8666, longitude: 2.3522, title: "Marker 3", description: "This is a new marker" },
    
    ]);

    useFocusEffect(
        useCallback(() => {
            // Mettre à jour la clé de la carte chaque fois que l'écran est focalisé
            setMapKey(Math.random().toString());
        }, [])
    );

    useEffect(() => {
        if (mapViewRef.current && markers.length > 0) {
            const markerCoordinates = markers.map(marker => ({
                latitude: marker.latitude,
                longitude: marker.longitude,
            }));
            // Utiliser un délai pour s'assurer que la carte est complètement chargée
            setTimeout(() => {
                if (mapViewRef.current) {
                    mapViewRef.current.fitToCoordinates(markerCoordinates, {
                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                        animated: true,
                    });
                }
            }, 200); // Délai de 200ms
        }
    }, [markers]);

    const refreshMarkers = () => {
        // Simuler une modification des marqueurs en mettant à jour l'état avec une nouvelle référence
        setMarkers(prevMarkers => [...prevMarkers]);
    };

    return (
        <View style={styles.mapContainer}>
            <Button mode="contained" onPress={refreshMarkers}>
                Rafraîchir les marqueurs
            </Button>
            <MapView
                ref={mapViewRef}
                key={mapKey}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: 48.8566, // Latitude de Paris
                    longitude: 2.3522, // Longitude de Paris
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {markers.map((marker, index) => (
                    <Marker
                        key={index}
                        coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                        title={marker.title}
                        description={marker.description}
                    />
                ))}
            </MapView>
        </View>
    );
};

const FirstTab = () => (
    <View style={styles.scene}>
        <Text>First Tab Content</Text>
    </View>
);

const SecondTab = () => (
    <View style={styles.scene}>
        <Text>Second Tab Content</Text>
    </View>
);

const MapsScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <MapScreen />
            </View>
            <View style={styles.tabContainer}>
                <TabView
                    renderTabBar={props => (
                        <TabBar
                            {...props}
                            indicatorStyle={{ backgroundColor: 'blue' }}
                            style={{ backgroundColor: 'white' }}
                            activeColor="blue"
                            inactiveColor="gray"
                        />
                    )}
                    navigationState={{
                        index: 0,
                        routes: [
                            { key: 'first', title: 'First' },
                            { key: 'second', title: 'Second' },
                        ],
                    }}
                    renderScene={SceneMap({
                        first: FirstTab,
                        second: SecondTab,
                    })}
                    onIndexChange={() => { }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    tabContainer: {
        flex: 1,
    },
    scene: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MapsScreen;