import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const logo = require('../logo.jpeg');

const SplashScreen = ({ onFinish, autoFinishDelay = 2200 }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.75)).current;
    const textAnim = useRef(new Animated.Value(30)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const exitAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
            Animated.timing(textAnim, { toValue: 0, duration: 600, delay: 300, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
        ]).start();

        // Exit after delay
        const timer = setTimeout(() => {
            Animated.timing(exitAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
                if (onFinish) onFinish();
            });
        }, autoFinishDelay);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: exitAnim }]}>
            <LinearGradient colors={COLORS.gradient} style={styles.background}>
                <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <View style={styles.logoContainer}>
                        <Image source={logo} style={styles.logoImage} resizeMode="contain" />
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
        </Animated.View>
    );
};


const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { alignItems: 'center' },
    logoContainer: { marginBottom: 24, alignItems: 'center' },
    logoImage: { width: 120, height: 120, borderRadius: 28 },
    logoText: {
        fontSize: 52,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -1,
        textAlign: 'center',
    },
    tagline: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginTop: 6,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    footer: { position: 'absolute', bottom: 50 },
    footerText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default SplashScreen;

