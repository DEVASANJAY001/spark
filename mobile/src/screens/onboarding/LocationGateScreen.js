import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';

const logo = require('../../../assets/logo.png');

const LocationGateScreen = ({ onRequest }) => {
    return (
        <LinearGradient colors={COLORS.gradient} style={styles.container}>
            <SafeAreaView style={styles.inner}>
                <View style={styles.logoWrap}>
                    <Image source={logo} style={styles.logo} resizeMode="contain" />
                </View>

                <View style={styles.iconCircle}>
                    <Ionicons name="location" size={64} color="white" />
                </View>

                <Text style={styles.title}>Location Required</Text>
                <Text style={styles.subtitle}>
                    Spark uses your location to show you people nearby. Without it, we can't find your matches.
                </Text>

                <TouchableOpacity style={styles.button} onPress={onRequest}>
                    <Ionicons name="navigate" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.buttonText}>ENABLE LOCATION</Text>
                </TouchableOpacity>

                <Text style={styles.note}>
                    Your exact location is never shared with other users — only approximate distance.
                </Text>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.l },
    logoWrap: { position: 'absolute', top: 60, alignItems: 'center' },
    logo: { width: 60, height: 60, borderRadius: 14 },
    iconCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    title: { fontSize: 30, fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: 16 },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    button: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        marginBottom: 24,
    },
    buttonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 },
    note: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 20,
    },
});

export default LocationGateScreen;
