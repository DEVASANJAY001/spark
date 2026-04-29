import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../screens/main/ChatScreen';
import ChatDetailScreen from '../screens/main/ChatDetailScreen';

const Stack = createNativeStackNavigator();

const ChatStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ChatList" component={ChatScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
        </Stack.Navigator>
    );
};

export default ChatStack;
