import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/main/ProfileScreen';

const Stack = createNativeStackNavigator();

const ProfileStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            {/* 
                NOTE: Deep screens (Settings, Safety, Support) have been moved 
                to RootNavigator to hide the bottom tab bar automatically.
            */}
        </Stack.Navigator>
    );
};

export default ProfileStack;
