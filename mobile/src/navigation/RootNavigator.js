import React, { useState, useEffect, useRef } from 'react';
import { Alert, Linking, AppState, Platform } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import MainTabNavigator from './MainTabNavigator';
import SplashScreen from '../components/SplashScreen';
import LocationGateScreen from '../screens/onboarding/LocationGateScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import CategoryDiscoveryScreen from '../screens/main/CategoryDiscoveryScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import PaymentScreen from '../screens/main/PaymentScreen';
import StaticContentScreen from '../screens/main/StaticContentScreen';
import useAuth from '../hooks/useAuth';
import { presenceService } from '../services/presenceService';
import { notificationService } from '../services/notificationService';
import { userService } from '../services/userService';

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
            console.log('[RootNavigator] Checking location status...');
            
            // 1. Check if device location services are ON
            const servicesEnabled = await Location.hasServicesEnabledAsync();
            console.log('[RootNavigator] Device Location Services:', servicesEnabled);
            
            if (!servicesEnabled) {
                console.log('[RootNavigator] Location services are OFF. Blocking access.');
                setLocationGranted(false);
                return;
            }

            // 2. Check app permission
            const { status } = await Location.getForegroundPermissionsAsync();
            console.log('[RootNavigator] App Permission Status:', status);

            if (status === 'granted') {
                setLocationGranted(true);
                // Background update of user's coordinates if logged in
                if (user?.uid) {
                    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
                        .then(pos => userService.updateDeviceLocation(user.uid, pos.coords))
                        .catch(err => console.log('Silent location update fail:', err));
                }
            } else if (status === 'undetermined') {
                // Permission never asked — request it now automatically
                const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                console.log('[RootNavigator] New Permission Request Result:', newStatus);
                setLocationGranted(newStatus === 'granted');
            } else {
                // Denied or restricted
                console.log('[RootNavigator] Permission Denied. Blocking access.');
                setLocationGranted(false);
            }
        } catch (e) {
            console.error('[RootNavigator] Location check error:', e);
            setLocationGranted(false);
        }
    };

    const requestLocation = async () => {
        try {
            console.log('[RootNavigator] Manual refresh requested...');
            
            // 1. Check permissions first
            let { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                status = newStatus;
            }

            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable location permissions in your phone settings.');
                return;
            }

            // 2. Try to enable services if off (Android only)
            if (Platform.OS === 'android') {
                const isEnabled = await Location.hasServicesEnabledAsync();
                if (!isEnabled) {
                    try {
                        await Location.enableNetworkProviderAsync();
                    } catch (e) {
                        // User might have cancelled or already on
                    }
                }
            }

            // 3. IMPORTANT: Small delay to let the OS update its internal state
            // and ensure expo-location sees the change.
            await new Promise(resolve => setTimeout(resolve, 800));

            // 4. Final verification
            const finalServicesEnabled = await Location.hasServicesEnabledAsync();
            const { status: finalPermission } = await Location.getForegroundPermissionsAsync();

            console.log('[RootNavigator] Final Sync - Services:', finalServicesEnabled, 'Perm:', finalPermission);

            if (finalServicesEnabled && finalPermission === 'granted') {
                console.log('[RootNavigator] Success! Refreshing UI.');
                setLocationGranted(true);
                if (user?.uid) {
                    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
                        .then(pos => userService.updateDeviceLocation(user.uid, pos.coords))
                        .catch(err => console.log('Silent manual location update fail:', err));
                }
            } else {
                console.log('[RootNavigator] Verification failed after refresh.');
                Alert.alert(
                    'Location Still Off',
                    'We still can\'t detect your location. Please make sure GPS is ON in your notification bar.',
                    [{ text: 'Check Again', onPress: () => requestLocation() }, { text: 'Settings', onPress: () => Linking.openSettings() }]
                );
            }
        } catch (e) {
            console.error('[RootNavigator] Request error:', e);
            setLocationGranted(false);
        }
    };


    // Show splash screen until auth loads + 2s minimum
    if (!splashDone || loading || locationGranted === null) {
        return (
            <SplashScreen
                onFinish={() => setSplashDone(true)}
                autoFinishDelay={1200}
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
                        <Stack.Screen name="CategoryDiscovery" component={CategoryDiscoveryScreen} />
                        <Stack.Screen name="Subscriptions" component={SubscriptionScreen} />
                        <Stack.Screen name="Payment" component={PaymentScreen} />
                        <Stack.Screen name="StaticContent" component={StaticContentScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
