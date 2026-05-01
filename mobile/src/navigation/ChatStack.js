import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../screens/main/ChatScreen';

const Stack = createNativeStackNavigator();

const ChatStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ChatList" component={ChatScreen} />
            {/* 
                NOTE: ChatDetail has been moved to RootNavigator 
                to hide the bottom tab bar during conversations.
            */}
        </Stack.Navigator>
    );
};

export default ChatStack;
