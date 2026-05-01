import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import ProgressBar from './ProgressBar';

const OnboardingBase = ({ 
    title, 
    subtitle, 
    children, 
    onNext, 
    onBack, 
    loading, 
    disabled, 
    progress,
    nextLabel = "Next" 
}) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#0a0a1a']}
                style={styles.background}
            />
            
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    {onBack && (
                        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={28} color="white" />
                        </TouchableOpacity>
                    )}
                    <View style={styles.progressWrap}>
                        <ProgressBar progress={progress} />
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <View style={styles.topSection}>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>

                    <View style={styles.mainSection}>
                        {children}
                    </View>

                    <View style={styles.bottomSection}>
                        <TouchableOpacity
                            style={[styles.nextButton, (disabled || loading) && styles.disabledButton]}
                            onPress={onNext}
                            disabled={disabled || loading}
                        >
                            <LinearGradient
                                colors={disabled ? ['#333', '#222'] : [COLORS.primary, '#0369A1']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.btnGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.nextText}>{nextLabel}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        height: 50,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressWrap: {
        flex: 1,
        marginHorizontal: 20,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.l,
        justifyContent: 'space-between',
    },
    topSection: {
        marginTop: 40,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
        marginTop: 10,
        lineHeight: 24,
    },
    mainSection: {
        flex: 1,
        marginTop: 40,
    },
    bottomSection: {
        marginBottom: 30,
    },
    nextButton: {
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
    },
    disabledButton: {
        opacity: 0.5,
    },
    btnGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    }
});

export default OnboardingBase;
