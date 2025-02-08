import React from 'react';
import { View, StyleSheet } from 'react-native';
//import Timetable from 'react-native-timetable';
import Timetable from '../components/timetable/src/index';
import { openInGoogleMaps } from '../utils/utils';

const Planning = ({ stage, handleEventChange }) => {
    const events = [
        ...stage.accommodations.map(accommodation => ({
            id: accommodation._id,
            title: accommodation.name,
            startTime: new Date(accommodation.arrivalDateTime),
            endTime: new Date(accommodation.departureDateTime),
            location: accommodation.address,
            color: 'green',
            type: 'accommodation',

        })),
        ...stage.activities.map(activity => ({
            id: activity._id,
            title: activity.name,
            startTime: new Date(activity.startDateTime),
            endTime: new Date(activity.endDateTime),
            location: activity.address,
            color: 'orange',
            type: 'activity',

        })),
    ];

    console.log("Events", events);

    return (
        <View style={{ flex: 1 }}>
            <Timetable
                events={events}
                mode="day"
                startHour={0}
                endHour={24}
                defaultScrollHour={10}
                currentDate={events[0].startTime}
                onEventChange={handleEventChange}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: {
        padding: 16,
    },
});

export default Planning;