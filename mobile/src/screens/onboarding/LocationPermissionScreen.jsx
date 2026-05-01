import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, Linking, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../constants/theme';
import useAuth from '../../hooks/useAuth';

const LocationPermissionScreen = () => {
    const { updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    const appState = useRef(AppState.currentState);

    // Auto-check on mount — if location is already granted, skip this screen
    useEffect(() => {
        checkExistingPermission();

        // Also check when returning from Settings
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                checkExistingPermission();
            }
            appState.current = nextAppState;
        });

        return () => subscription.remove();
    }, []);

    const checkExistingPermission = async () => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                // Already granted — get position and proceed
                await fetchAndSaveLocation();
            } else {
                setChecking(false);
            }
        } catch (e) {
            console.warn('Permission check failed:', e.message);
            setChecking(false);
        }
    };

    const fetchAndSaveLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 10000,
            });
            const { latitude, longitude } = location.coords;

            let city = 'Nearby';
            try {
                const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (reverse && reverse.length > 0) {
                    city = reverse[0].city || reverse[0].region || 'Nearby';
                }
            } catch (geoErr) {
                console.warn('Geocoding failed:', geoErr.message);
            }

            await updateProfile({
                location: { latitude, longitude },
                cityName: city,
                locationEnabled: true,
            });
            // RootNavigator will automatically navigate to Main
        } catch (error) {
            console.error('Location fetch failed:', error.message);
            setChecking(false);
            showLocationError();
        }
    };

    const showLocationError = () => {
        if (Platform.OS === 'web') {
            alert('Could not detect your location. Please enable location services in your browser and try again.');
        } else {
            Alert.alert(
                'Location Not Detected',
                'Please enable location services on your device to use Spark.',
                [
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                    { text: 'Try Again', onPress: () => handleGrantPermission() },
                ]
            );
        }
    };

    const handleGrantPermission = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                if (Platform.OS === 'web') {
                    alert('Location permission is required to use Spark. Please allow location access in your browser.');
                } else {
                    Alert.alert(
                        'Location Required',
                        'Spark needs your location to show you people nearby. Please enable it in your settings.',
                        [
                            { text: 'Open Settings', onPress: () => Linking.openSettings() },
                            { text: 'Cancel', style: 'cancel' },
                        ]
                    );
                }
                setLoading(false);
                return;
            }

            await fetchAndSaveLocation();
        } catch (error) {
            console.error('Error getting location:', error);
            showLocationError();
        } finally {
            setLoading(false);
        }
    };

    // Show loading spinner while auto-checking existing permission
    if (checking) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: 'white', marginTop: 15, fontSize: 14 }}>Checking location...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={COLORS.gradient} style={styles.background}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="location" size={80} color="white" />
                    </View>

                    <Text style={styles.title}>Enable Location</Text>
                    <Text style={styles.subtitle}>
                        To find your Spark, we need to know where you are. We use your location to show you matches in your area.
                    </Text>

                    <View style={styles.illustrationContainer}>
                        <Ionicons name="people-circle-outline" size={150} color="rgba(255,255,255,0.3)" />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleGrantPermission}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.primary} />
                        ) : (
                            <Text style={styles.buttonText}>Allow Location</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.footerText}>
                        You can change this later in Settings.
                    </Text>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 15,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    illustrationContainer: {
        marginVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        backgroundColor: 'white',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 40,
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.2)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
            }
        }),
    },
    buttonText: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 20,
    },
});

export default LocationPermissionScreen;
