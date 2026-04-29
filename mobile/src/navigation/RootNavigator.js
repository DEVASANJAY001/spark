import React, { useState, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import MainTabNavigator from './MainTabNavigator';
import SplashScreen from '../components/SplashScreen';
import LocationGateScreen from '../screens/onboarding/LocationGateScreen';
import useAuth from '../hooks/useAuth';
import { presenceService } from '../services/presenceService';
import { notificationService } from '../services/notificationService';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const { user, profile, isProfileComplete, loading } = useAuth();
    const [splashDone, setSplashDone] = useState(false);
    const [locationGranted, setLocationGranted] = useState(null); // null = checking

    // Check location permission on app start
    useEffect(() => {
        checkLocation();
    }, []);

    // Presence & Notifications
    useEffect(() => {
        if (user) {
            const unsubscribePresence = presenceService.setUserStatus(user.uid);
            
            // Register for push notifications
            const initNotifications = async () => {
                await notificationService.registerForPushNotificationsAsync(user.uid);
            };
            initNotifications();

            const unsubscribeNotif = notificationService.addListener((notif) => {
                console.log('Received notification:', notif);
            });

            return () => {
                if (unsubscribePresence) unsubscribePresence();
                unsubscribeNotif();
            };
        }
    }, [user]);

    const checkLocation = async () => {
        try {
            // First check if device location services are ON
            const servicesEnabled = await Location.hasServicesEnabledAsync();
            if (!servicesEnabled) {
                setLocationGranted(false);
                return;
            }
            // Then check app permission
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationGranted(true);
            } else if (status === 'undetermined') {
                // Permission never asked — request it now automatically
                const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                setLocationGranted(newStatus === 'granted');
            } else {
                // Denied — show gate
                setLocationGranted(false);
            }
        } catch (e) {
            console.warn('Location check error:', e);
            setLocationGranted(false);
        }
    };

    const requestLocation = async () => {
        try {
            const servicesEnabled = await Location.hasServicesEnabledAsync();
            if (!servicesEnabled) {
                Alert.alert(
                    'Location Services Off',
                    'Please turn on Location Services in your phone Settings, then come back.',
                    [
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                        { text: 'Try Again', onPress: checkLocation },
                    ]
                );
                return;
            }
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationGranted(true);
            } else {
                Alert.alert(
                    'Location Permission Denied',
                    'Spark needs your location to show nearby people. Please allow location access in your phone Settings.',
                    [
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                        { text: 'Try Again', onPress: checkLocation },
                    ]
                );
            }
        } catch (e) {
            console.warn('Location request error:', e);
        }
    };


    // Show splash screen until auth loads + 2s minimum
    if (!splashDone || loading || locationGranted === null) {
        return (
            <SplashScreen
                onFinish={() => setSplashDone(true)}
                autoFinishDelay={2200}
            />
        );
    }

    // Location not granted — show gate screen
    if (!locationGranted) {
        return <LocationGateScreen onRequest={requestLocation} />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Auth" component={AuthStack} />
                ) : !isProfileComplete ? (
                    <Stack.Screen name="Onboarding" component={OnboardingStack} />
                ) : (
                    <Stack.Screen name="Main" component={MainTabNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
