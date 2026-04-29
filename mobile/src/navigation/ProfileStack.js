import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import StaticContentScreen from '../screens/main/StaticContentScreen';
import SupportTicketScreen from '../screens/main/SupportTicketScreen';
import SupportTicketsScreen from '../screens/main/SupportTicketsScreen';
import TicketChatScreen from '../screens/main/TicketChatScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';

const Stack = createNativeStackNavigator();

const ProfileStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="StaticContent" component={StaticContentScreen} />
            <Stack.Screen name="SupportTickets" component={SupportTicketsScreen} />
            <Stack.Screen name="SupportTicket" component={SupportTicketScreen} />
            <Stack.Screen name="TicketChat" component={TicketChatScreen} />
            <Stack.Screen name="Transactions" component={TransactionsScreen} />
        </Stack.Navigator>
    );
};

export default ProfileStack;
