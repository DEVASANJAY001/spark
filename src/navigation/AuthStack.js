import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from '../screens/auth/LandingScreen';
import EmailLoginScreen from '../screens/auth/EmailLoginScreen';
import EmailSignUpScreen from '../screens/auth/EmailSignUpScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
            <Stack.Screen name="EmailSignUp" component={EmailSignUpScreen} />
        </Stack.Navigator>
    );
};

export default AuthStack;