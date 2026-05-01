import React, { useState, useEffect, useRef } from 'react';
import { Alert, Linking, AppState } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import MainTabNavigator from './MainTabNavigator';
import SplashScreen from '../components/SplashScreen';
import LocationGateScreen from '../screens/onboarding/LocationGateScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import useAuth from '../hooks/useAuth';
import { presenceService } from '../services/presenceService';
import { notificationService } from '../services/notificationService';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const { user, profile, isProfileComplete, loading } = useAuth();
    const [splashDone, setSplashDone] = useState(false);
    const [locationGranted, setLocationGranted] = useState(null); // null = checking

    const appState = useRef(AppState.currentState);

    // Check location permission on app start
    useEffect(() => {
        checkLocation();
        // Re-check when user returns from Settings
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                checkLocation();
            }
            appState.current = nextAppState;
        });
        return () => subscription.remove();
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
            // 1. Try to enable location services automatically (System Dialog)
            if (Platform.OS === 'android') {
                try {
                    await Location.enableNetworkProviderAsync();
                } catch (e) {
                    console.log('Network provider enable failed or cancelled');
                }
            }

            // 2. Check if services are now enabled
            const servicesEnabled = await Location.hasServicesEnabledAsync();
            if (!servicesEnabled) {
                Alert.alert(
                    'Location Services Required',
                    'Please enable location services in your device settings to continue.',
                    [
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
                return;
            }

            // 3. Request Permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationGranted(true);
            } else {
                Alert.alert(
                    'Permission Denied',
                    'Spark needs your location to find nearby matches.',
                    [{ text: 'Open Settings', onPress: () => Linking.openSettings() }]
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
        <NavigationContainer theme={DarkTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Auth" component={AuthStack} />
                ) : !isProfileComplete ? (
                    <Stack.Screen name="Onboarding" component={OnboardingStack} />
                ) : (
                    <>
                        <Stack.Screen name="Main" component={MainTabNavigator} />
                        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
