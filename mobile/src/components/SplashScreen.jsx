import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND_COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const logo = require('../logo.jpeg');

const SplashScreen = ({ onFinish, autoFinishDelay = 2200 }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const textFadeAnim = useRef(new Animated.Value(0)).current;
    const textSlideAnim = useRef(new Animated.Value(20)).current;
    const exitAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrance sequence
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(textFadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(textSlideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            ])
        ]).start();

        // Pulsing logo effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        ).start();

        // Exit sequence
        const timer = setTimeout(() => {
            Animated.timing(exitAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
                if (onFinish) onFinish();
            });
        }, autoFinishDelay);

        return () => clearTimeout(timer);
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-10deg', '0deg']
    });

    return (
        <Animated.View style={[styles.container, { opacity: exitAnim }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient 
                colors={['#000000', '#1a1a1a', '#000000']} 
                style={styles.background}
            >
                {/* Decorative Blur Circles */}
                <View style={[styles.blurCircle, { top: -100, left: -100, backgroundColor: BRAND_COLORS.pink + '20' }]} />
                <View style={[styles.blurCircle, { bottom: -100, right: -100, backgroundColor: BRAND_COLORS.blue + '20' }]} />

                <Animated.View style={[
                    styles.content, 
                    { 
                        opacity: fadeAnim, 
                        transform: [
                            { scale: Animated.multiply(scaleAnim, pulseAnim) },
                            { rotate: spin }
                        ] 
                    }
                ]}>
                    <View style={styles.logoOuter}>
                        <LinearGradient
                            colors={[BRAND_COLORS.pink, BRAND_COLORS.blue]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.logoBorder}
                        >
                            <View style={styles.logoInner}>
                                <Image source={logo} style={styles.logoImage} />
                            </View>
                        </LinearGradient>
                    </View>

                    <Animated.View style={{ 
                        opacity: textFadeAnim, 
                        transform: [{ translateY: textSlideAnim }],
                        alignItems: 'center' 
                    }}>
                        <Text style={styles.logoText}>SPARK</Text>
                        <View style={styles.taglineRow}>
                            <View style={styles.line} />
                            <Text style={styles.tagline}>Find Your Flame</Text>
                            <View style={styles.line} />
                        </View>
                    </Animated.View>
                </Animated.View>

                <View style={styles.footer}>
                    <ActivityIndicator size="small" color={BRAND_COLORS.pink} style={{ marginBottom: 20 }} />
                    <Text style={styles.footerText}>DAVNS INDUSTRIES</Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    background: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    blurCircle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.5,
    },
    content: { alignItems: 'center' },
    logoOuter: {
        marginBottom: 30,
        shadowColor: BRAND_COLORS.pink,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    logoBorder: {
        padding: 4,
        borderRadius: 40,
    },
    logoInner: {
        backgroundColor: '#000',
        borderRadius: 36,
        padding: 4,
    },
    logoImage: { width: 120, height: 120, borderRadius: 32 },
    logoText: {
        fontSize: 60,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 10,
        textAlign: 'center',
        marginLeft: 10, // Adjust for letter spacing
    },
    taglineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 10,
    },
    line: {
        width: 20,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    tagline: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '700',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    footer: { position: 'absolute', bottom: 60, alignItems: 'center' },
    footerText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 3,
    },
});

const ActivityIndicator = ({ size, color, style }) => (
    <Animated.View style={style}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
    </Animated.View>
);

export default SplashScreen;
