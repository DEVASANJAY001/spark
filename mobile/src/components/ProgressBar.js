import React from 'react';
import { View, StyleSheet } from 'react-native';

const ProgressBar = ({ progress }) => {
    return (
        <View style={styles.container}>
            <View style={[styles.progress, { width: `${progress * 100}%` }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 6,
        backgroundColor: '#3c3c3c',
        width: '100%',
    },
    progress: {
        height: '100%',
        backgroundColor: '#FF4458',
    },
});

export default ProgressBar;