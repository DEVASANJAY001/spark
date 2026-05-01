import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import SwipeScreen from '../screens/main/SwipeScreen';
import ExploreScreen from '../screens/main/ExploreScreen';
import LikesScreen from '../screens/main/LikesScreen';
import ChatStack from './ChatStack';
import ProfileStack from './ProfileStack';
import { COLORS } from '../constants/theme';
import { swipeService } from '../services/swipeService';
import useAuth from '../hooks/useAuth';

import CustomTabBar from '../components/CustomTabBar';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { user } = useAuth();
    const [likesCount, setLikesCount] = useState(0);

    useEffect(() => {
        if (user) {
            const unsubscribe = swipeService.getLikes(user.uid, ({ count }) => {
                setLikesCount(count);
            });
            return () => unsubscribe();
        }
    }, [user]);

    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Swipe" component={SwipeScreen} />
            <Tab.Screen name="Explore" component={ExploreScreen} />
            <Tab.Screen 
                name="Likes" 
                component={LikesScreen} 
                options={{ tabBarBadge: likesCount > 0 ? (likesCount > 99 ? '99+' : likesCount) : null }}
            />
            <Tab.Screen 
                name="Chat" 
                component={ChatStack} 
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        // Reset to top of stack when tab is pressed
                        navigation.navigate('Chat', { screen: 'ChatList' });
                    },
                })}
            />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 32,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 4,
        position: 'absolute',
        bottom: -8,
    }
});

export default MainTabNavigator;