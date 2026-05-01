import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { COLORS, BRAND_COLORS, LAYOUT } from '../constants/theme';

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();
    
    // Logic to hide tab bar in nested screens (like ChatDetail)
    const focusedRoute = state.routes[state.index];
    const focusedRouteName = getFocusedRouteNameFromRoute(focusedRoute);
    
    const hiddenIn = ['ChatDetail', 'EditProfile', 'Settings', 'UserProfile', 'TicketChat'];
    if (hiddenIn.includes(focusedRouteName)) {
        return null;
    }

    return (
        <View style={[styles.container, { height: LAYOUT.TAB_BAR_HEIGHT + insets.bottom / 2 }]}>
            <View style={styles.pillContainer}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                            ? options.title
                            : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const tintColor = isFocused ? BRAND_COLORS.blue : 'rgba(255,255,255,0.5)';

                    let iconName;
                    if (route.name === 'Swipe') iconName = 'home-outline';
                    else if (route.name === 'Explore') iconName = 'compass-outline';
                    else if (route.name === 'Likes') iconName = 'heart-outline';
                    else if (route.name === 'Chat') iconName = 'chatbubble-outline';
                    else if (route.name === 'Profile') iconName = 'person-outline';

                    return (
                        <TouchableOpacity
                            key={index}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconWrapper]}>
                                <Ionicons name={isFocused ? iconName.replace('-outline', '') : iconName} size={26} color={tintColor} />
                                {options.tabBarBadge && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.label, { color: tintColor }]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        width: width,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    pillContainer: {
        flexDirection: 'row',
        backgroundColor: '#000000',
        height: 80,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderLeftWidth: 4,
        borderRightWidth: 4,
        borderLeftColor: BRAND_COLORS.pink,
        borderRightColor: BRAND_COLORS.pink,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 15,
        paddingBottom: Platform.OS === 'ios' ? 15 : 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 25,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
    },
    label: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
        letterSpacing: 0.3,
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: BRAND_COLORS.pink,
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#000',
    },
    badgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    }
});

export default CustomTabBar;
