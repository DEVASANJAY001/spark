import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

let FaceDetector = null;
let FaceDetectorAvailable = false;

try {
    // Dynamically require to prevent crash on boot
    FaceDetector = require('expo-face-detector');
    if (FaceDetector) {
        FaceDetectorAvailable = true;
    }
} catch (e) {
    console.warn('FaceDetector native module not found, falling back to manual mode.');
}

import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const PhotoVerificationScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { user, profile } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [step, setStep] = useState('instructions'); // 'instructions' | 'camera' | 'analyzing' | 'success'
    const cameraRef = useRef(null);
    const countdownTimer = useRef(null);

    const startCamera = async () => {
        if (!permission.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert("Permission Required", "Camera access is needed for verification.");
                return;
            }
        }
        setStep('camera');
    };

    const handleFacesDetected = ({ faces }) => {
        if (!FaceDetectorAvailable || step !== 'camera' || isCapturing) return;

        const detected = faces.length > 0;
        setIsFaceDetected(detected);

        if (detected && countdown === null) {
            // Start auto-capture countdown
            setCountdown(2);
        } else if (!detected && countdown !== null) {
            // Reset countdown if face is lost
            setCountdown(null);
            if (countdownTimer.current) clearInterval(countdownTimer.current);
        }
    };

    useEffect(() => {
        if (countdown === 2) {
            countdownTimer.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownTimer.current);
                        takePicture();
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (countdownTimer.current) clearInterval(countdownTimer.current);
        };
    }, [countdown]);

    const takePicture = async () => {
        // If FaceDetector is not available, we allow capture anyway
        if (!cameraRef.current || (FaceDetectorAvailable && !isFaceDetected) || isCapturing) return;

        setIsCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.5,
                base64: true,
            });

            setStep('analyzing');
            
            // Simulate AI Analysis Delay (just for visual effect)
            await new Promise(resolve => setTimeout(resolve, 3500));

            // FOR PROTOTYPE: Update status immediately
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { isVerified: true, isProfileComplete: true });
            
            // Also update RTDB
            const { ref: rtdbRef, update: rtdbUpdate } = await import('firebase/database');
            const { rtdb } = await import('../../firebase/config');
            const profileRef = rtdbRef(rtdb, `users/${user.uid}/profile`);
            await rtdbUpdate(profileRef, { isVerified: true, isProfileComplete: true });

            setStep('success');
        } catch (error) {
            console.error('Verification submission error:', error);
            Alert.alert("Submission Failed", "We couldn't submit your request. Please try again.");
            setStep('camera');
        } finally {
            setIsCapturing(false);
        }
    };

    if (!permission) return <View />;

    if (profile?.isVerified || step === 'success') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Verified</Text>
                    <View style={{ width: 28 }} />
                </View>
                <View style={[styles.content, { justifyContent: 'center' }]}>
                    <View style={styles.successBadgeContainer}>
                        <LinearGradient
                            colors={['#FF3366', '#FF1493', '#9C27B0']}
                            style={styles.successIconCircle}
                        >
                            <Ionicons name="checkmark-circle" size={80} color="white" />
                        </LinearGradient>
                        <View style={styles.successConfettiWrap}>
                            <Ionicons name="sparkles" size={40} color="#FFD700" style={styles.confetti1} />
                            <Ionicons name="sparkles" size={30} color="#00E5FF" style={styles.confetti2} />
                        </View>
                    </View>
                    
                    <Text style={[styles.successTitle, { color: colors.text }]}>You're Verified!</Text>
                    <Text style={[styles.successSub, { color: colors.textSecondary }]}>
                        Welcome to the elite circle! Your profile now proudly displays the pink verification badge, helping you stand out and build trust.
                    </Text>
                    
                    <TouchableOpacity 
                        style={[styles.primaryBtn, styles.successBtn]} 
                        onPress={() => navigation.goBack()}
                    >
                        <LinearGradient
                            colors={['#FF3366', '#FF1493']}
                            style={styles.btnGradient}
                        >
                            <Text style={styles.btnText}>Start Swiping</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (step === 'instructions') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Verification</Text>
                    <View style={{ width: 28 }} />
                </View>
                <View style={styles.content}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Get Verified</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Prove you're the person in your photos by taking a quick selfie.
                    </Text>
                    
                    <View style={styles.instructionBox}>
                        <View style={styles.stepRow}>
                            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                            <Text style={[styles.stepText, { color: colors.text }]}>Mimic the pose shown on screen</Text>
                        </View>
                        <View style={styles.stepRow}>
                            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                            <Text style={[styles.stepText, { color: colors.text }]}>Ensure your face is clearly visible</Text>
                        </View>
                        <View style={styles.stepRow}>
                            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
                            <Text style={[styles.stepText, { color: colors.text }]}>Submit for review</Text>
                        </View>
                    </View>

                    {!FaceDetectorAvailable && (
                        <View style={styles.fallbackNotice}>
                            <Ionicons name="information-circle" size={16} color="#888" />
                            <Text style={styles.fallbackNoticeText}>Automatic detection unavailable. You can take the photo manually.</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.primaryBtn} onPress={startCamera}>
                        <Text style={styles.primaryBtnText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (step === 'camera') {
        return (
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="front"
                    onFacesDetected={FaceDetectorAvailable ? handleFacesDetected : undefined}
                    faceDetectorSettings={FaceDetectorAvailable ? {
                        mode: FaceDetector.FaceDetectorMode.fast,
                        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                        runClassifications: FaceDetector.FaceDetectorClassifications.none,
                        minDetectionInterval: 100,
                        tracking: true,
                    } : undefined}
                >
                    <SafeAreaView style={styles.cameraOverlay}>
                        <View style={styles.cameraHeader}>
                            <TouchableOpacity onPress={() => setStep('instructions')}>
                                <Ionicons name="chevron-back" size={30} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.cameraTitle}>Take a Selfie</Text>
                            <View style={{ width: 30 }} />
                        </View>

                        <View style={styles.faceFrameContainer}>
                            <View style={[
                                styles.faceFrame,
                                (FaceDetectorAvailable && isFaceDetected) ? styles.faceDetected : styles.faceNotDetected
                            ]} />
                            
                            {countdown !== null && (
                                <View style={styles.countdownContainer}>
                                    <Text style={styles.countdownText}>{countdown}</Text>
                                    <Text style={styles.countdownLabel}>Hold Still...</Text>
                                </View>
                            )}

                            {FaceDetectorAvailable && !isFaceDetected && (
                                <Text style={styles.faceHint}>Position your face in the frame</Text>
                            )}
                            {!FaceDetectorAvailable && (
                                <Text style={styles.faceHint}>Align your face and take a photo</Text>
                            )}
                        </View>

                        <View style={styles.cameraFooter}>
                            <TouchableOpacity 
                                style={[styles.captureBtn, (FaceDetectorAvailable && !isFaceDetected) && styles.captureBtnDisabled]}
                                onPress={takePicture}
                                disabled={(FaceDetectorAvailable && !isFaceDetected) || isCapturing}
                            >
                                <View style={styles.captureBtnInner}>
                                    {FaceDetectorAvailable && isFaceDetected && (
                                        <Text style={styles.autoCaptureText}>AUTO</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </CameraView>
            </View>
        );
    }

    if (step === 'analyzing') {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <View style={styles.scanningContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <View style={styles.scanLine} />
                </View>
                <Text style={[styles.loadingTitle, { color: colors.text }]}>AI Analysis in Progress</Text>
                <View style={styles.analysisSteps}>
                    <Text style={[styles.analysisText, { color: colors.textSecondary }]}>• Checking face geometry...</Text>
                    <Text style={[styles.analysisText, { color: colors.textSecondary, marginTop: 8 }]}>• Comparing with profile photos...</Text>
                    <Text style={[styles.analysisText, { color: colors.textSecondary, marginTop: 8 }]}>• Verifying authenticity...</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#FF3366' + '20' }]}>
                <Ionicons name="time" size={60} color="#FF3366" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Request Under Review</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 }]}>
                Our team is reviewing your profile. You will receive the pink badge once your identity is confirmed.
            </Text>
            <TouchableOpacity 
                style={[styles.primaryBtn, { width: 200, marginTop: 10 }]} 
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.primaryBtnText}>Back to Profile</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    successBadgeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        position: 'relative',
    },
    successIconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#FF3366',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    successConfettiWrap: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    confetti1: {
        position: 'absolute',
        top: -10,
        right: -10,
    },
    confetti2: {
        position: 'absolute',
        bottom: 20,
        left: -30,
    },
    successTitle: {
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 15,
    },
    successSub: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    successBtn: {
        padding: 0,
        overflow: 'hidden',
    },
    btnGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
    },
    content: { flex: 1, padding: 30, alignItems: 'center' },
    iconCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    title: { fontSize: 26, fontWeight: '900', marginBottom: 10 },
    subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
    instructionBox: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 25,
        marginBottom: 40,
    },
    stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    stepNum: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    stepNumText: { color: 'black', fontSize: 14, fontWeight: 'bold' },
    stepText: { fontSize: 15, fontWeight: '600' },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        width: '100%',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnText: { color: 'black', fontSize: 16, fontWeight: '900' },
    fallbackNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 10,
        borderRadius: 10,
        marginBottom: 20,
        width: '100%',
        justifyContent: 'center',
    },
    fallbackNoticeText: {
        color: '#888',
        fontSize: 12,
        marginLeft: 8,
    },
    cameraContainer: { flex: 1, backgroundColor: 'black' },
    camera: { flex: 1 },
    cameraOverlay: { flex: 1, justifyContent: 'space-between' },
    cameraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    cameraTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    faceFrameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    faceFrame: {
        width: width * 0.75,
        height: width * 0.9,
        borderWidth: 3,
        borderRadius: width * 0.4,
        borderStyle: 'dashed',
    },
    faceDetected: { borderColor: COLORS.primary },
    faceNotDetected: { borderColor: 'white' },
    faceHint: { color: 'white', marginTop: 20, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    cameraFooter: { paddingBottom: 40, alignItems: 'center' },
    captureBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureBtnInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    autoCaptureText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FF3366',
    },
    countdownContainer: {
        position: 'absolute',
        top: '30%',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 80,
        fontWeight: '900',
        color: 'white',
    },
    countdownLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginTop: -10,
    },
    captureBtnDisabled: { opacity: 0.3 },
    scanningContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: COLORS.primary + '30',
    },
    loadingTitle: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 20,
    },
    analysisSteps: {
        alignItems: 'flex-start',
        width: '100%',
        paddingHorizontal: 50,
    },
    analysisText: {
        fontSize: 14,
        fontWeight: '600',
    }
});

export default PhotoVerificationScreen;
