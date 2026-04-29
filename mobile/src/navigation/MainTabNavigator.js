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
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (focused) {
                        if (route.name === 'Swipe') iconName = 'flame';
                        else if (route.name === 'Explore') iconName = 'search';
                        else if (route.name === 'Likes') iconName = 'heart';
                        else if (route.name === 'Chat') iconName = 'chatbubble-ellipses';
                        else if (route.name === 'Profile') iconName = 'person';
                    } else {
                        if (route.name === 'Swipe') iconName = 'flame-outline';
                        else if (route.name === 'Explore') iconName = 'search-outline';
                        else if (route.name === 'Likes') iconName = 'heart-outline';
                        else if (route.name === 'Chat') iconName = 'chatbubble-ellipses-outline';
                        else if (route.name === 'Profile') iconName = 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: '#bbb',
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: -2,
                },
                tabBarStyle: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    borderTopWidth: 0,
                    elevation: 0,
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingTop: 10,
                    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
                },
                tabBarBadge: route.name === 'Likes' && likesCount > 0 ? (likesCount > 99 ? '99+' : likesCount) : null,
                tabBarBadgeStyle: {
                    backgroundColor: '#FFD700',
                    color: 'black',
                    fontSize: 10,
                    fontWeight: 'bold',
                },
            })}
        >
            <Tab.Screen name="Swipe" component={SwipeScreen} />
            <Tab.Screen name="Explore" component={ExploreScreen} />
            <Tab.Screen name="Likes" component={LikesScreen} />
            <Tab.Screen name="Chat" component={ChatStack} />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;