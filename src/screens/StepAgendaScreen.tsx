/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';
import Timeline from 'react-native-timeline-flatlist'

export default class Example extends Component {
    data: ({ time: string; title: string; description: string; circleColor: string; lineColor: string; } | { time: string; title: string; description: string; circleColor?: undefined; lineColor?: undefined; } | { time: string; title: string; description?: undefined; circleColor?: undefined; lineColor?: undefined; } | { time: string; title: string; description: string; lineColor: string; circleColor?: undefined; } | { time: string; title: string; description: string; circleColor: string; lineColor?: undefined; })[];
    constructor(props: any) {
        super(props)
        this.data = [
            { time: '09:00', title: 'Archery Training', description: 'The Beginner Archery and Beginner Crossbow course does not require you to bring any equipment, since everything you need will be provided for the course. ', circleColor: '#009688', lineColor: '#009688' },
            { time: '10:45', title: 'Play Badminton', description: 'Badminton is a racquet sport played using racquets to hit a shuttlecock across a net.' },
            { time: '12:00', title: 'Lunch' },
            { time: '14:00', title: 'Watch Soccer', description: 'Team sport played between two teams of eleven players with a spherical ball. ', lineColor: '#009688' },
            { time: '16:30', title: 'Go to Fitness center', description: 'Look out for the Best Gym & Fitness Centers around me :)', circleColor: '#009688' }
        ]
    }

    render() {
        //'rgb(45,156,219)'
        return (
            <View style={styles.container}>
                <Timeline
                    style={styles.list}
                    data={this.data}
                    circleSize={20}
                    dotSize={10}
                    circleColor='rgb(45,156,219)'
                    lineColor='rgb(45,156,219)'
                    timeContainerStyle={{ minWidth: 50, marginTop: 0 }}
                    timeStyle={{ textAlign: 'center', backgroundColor: '#ff9797', color: 'white', padding: 5, borderRadius: 13 }}
                    descriptionStyle={{ color: 'gray' }}
                    innerCircle={'dot'}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
        paddingTop: 35,
        backgroundColor: 'white'
    },
    list: {
        flex: 1,
        marginTop: 0,
    },
});