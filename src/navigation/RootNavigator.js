import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import MainTabNavigator from './MainTabNavigator';
import LocationPermissionScreen from '../screens/onboarding/LocationPermissionScreen';
import useAuth from '../hooks/useAuth';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const { user, profile, isProfileComplete, loading } = useAuth();

    // Show nothing while auth/profile is loading to prevent screen flash
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Auth" component={AuthStack} />
                ) : !isProfileComplete ? (
                    <Stack.Screen name="Onboarding" component={OnboardingStack} />
                ) : !profile?.locationEnabled ? (
                    <Stack.Screen name="LocationGate" component={LocationPermissionScreen} />
                ) : (
                    <Stack.Screen name="Main" component={MainTabNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;