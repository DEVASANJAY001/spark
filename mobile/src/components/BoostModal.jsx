import React, { useEffect, useRef, useState } from 'react';
import {
    Modal, View, Text, StyleSheet, Animated, Dimensions,
    TouchableOpacity, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const BoostModal = ({ visible, onClose }) => {
    const [countdown, setCountdown] = useState(3);
    const pulseAnim  = useRef(new Animated.Value(1)).current;
    const glowAnim   = useRef(new Animated.Value(0)).current;
    const scaleAnim  = useRef(new Animated.Value(0.6)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const ringAnim   = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible) { setCountdown(3); return; }

        // Entry animation
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();

        // Pulsing glow
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // Ring expand
        Animated.loop(
            Animated.timing(ringAnim, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true })
        ).start();

        // Countdown
        let count = 3;
        const timer = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count <= 0) {
                clearInterval(timer);
                setTimeout(onClose, 400);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [visible]);

    const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
    const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 0] });

    if (!visible) return null;

    return (
        <Modal transparent animationType="none" visible={visible}>
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={['#1a001a', '#0d0022', '#000']}
                        style={StyleSheet.absoluteFillObject}
                    />

                    {/* Expanding ring */}
                    <Animated.View style={[styles.ring, {
                        transform: [{ scale: ringScale }],
                        opacity: ringOpacity,
                    }]} />

                    {/* Icon with pulse */}
                    <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
                        <LinearGradient
                            colors={['#9b51e0', '#6a0dad', '#3d0070']}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="flash" size={52} color="white" />
                        </LinearGradient>
                    </Animated.View>

                    <Text style={styles.title}>Profile Boosted!</Text>
                    <Text style={styles.sub}>You're now a top pick for people nearby</Text>

                    <View style={styles.countdownRow}>
                        <Text style={styles.countdownLabel}>Activating in</Text>
                        <Text style={styles.countdownNum}>{countdown}</Text>
                    </View>

                    <Text style={styles.detail}>📍 Visible to users within 500 – 1000 KM for 20 minutes</Text>

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>Got it!</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: width * 0.88,
        borderRadius: 28,
        padding: 32,
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(155,81,224,0.4)',
    },
    ring: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#9b51e0',
        top: 40,
    },
    iconWrap: {
        marginBottom: 24,
        marginTop: 20,
    },
    iconGradient: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#9b51e0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
        elevation: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    sub: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    countdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        backgroundColor: 'rgba(155,81,224,0.15)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(155,81,224,0.3)',
    },
    countdownLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
    },
    countdownNum: {
        color: '#9b51e0',
        fontSize: 28,
        fontWeight: '900',
    },
    detail: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 20,
    },
    closeBtn: {
        backgroundColor: '#9b51e0',
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 50,
    },
    closeBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default BoostModal;
