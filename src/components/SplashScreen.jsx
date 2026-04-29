import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const textAnim = useRef(new Animated.Value(20)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(textAnim, {
                toValue: 0,
                duration: 800,
                delay: 300,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 800,
                delay: 300,
                useNativeDriver: Platform.OS !== 'web',
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient colors={COLORS.gradient} style={styles.background}>
                <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="flame" size={100} color="white" />
                        <View style={styles.sparkle1} />
                        <View style={styles.sparkle2} />
                    </View>
                    <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: textAnim }] }}>
                        <Text style={styles.logoText}>Spark</Text>
                        <Text style={styles.tagline}>Find Your Flame</Text>
                    </Animated.View>
                </Animated.View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>MADE WITH ❤️ FOR YOU</Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 20,
        position: 'relative',
    },
    logoText: {
        fontSize: 48,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -1,
        textAlign: 'center',
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginTop: 5,
        letterSpacing: 2,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    sparkle1: {
        position: 'absolute',
        top: 0,
        right: -10,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    sparkle2: {
        position: 'absolute',
        bottom: 20,
        left: -15,
        width: 15,
        height: 15,
        borderRadius: 7.5,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
    },
    footerText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default SplashScreen;
