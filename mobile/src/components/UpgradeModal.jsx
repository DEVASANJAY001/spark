import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import useAuth from '../hooks/useAuth';
import { db } from '../firebase/config';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const UpgradeModal = ({ visible, onClose, tier = 'gold' }) => {
    const navigation = useNavigation();
    const { user, updateProfile } = useAuth();
    const [planData, setPlanData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible) {
            fetchPlanDetails();
        }
    }, [visible, tier]);

    const fetchPlanDetails = async () => {
        setLoading(true);
        try {
            const planRef = doc(db, 'plans', tier.toLowerCase());
            const planSnap = await getDoc(planRef);
            if (planSnap.exists()) {
                setPlanData(planSnap.data());
            } else {
                setPlanData(null);
            }
        } catch (error) {
            console.error('Error fetching plan for modal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = () => {
        if (!planData) return;
        onClose();
        navigation.navigate('Payment', { 
            plan: { 
                id: tier, 
                ...planData,
                price: planData.price // Ensure price is passed correctly
            } 
        });
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : !planData ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={48} color={COLORS.primary} />
                        <Text style={styles.errorText}>Plan no longer available.</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <LinearGradient
                        colors={planData.colors || ['#1a1a1a', '#000']}
                        style={styles.container}
                    >
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.header}>
                                <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                                    <Ionicons name="close" size={30} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.logoText}>spark</Text>
                                <View style={[styles.tierBadge, { backgroundColor: planData.colors?.[0] || COLORS.primary }]}>
                                    <Text style={styles.tierBadgeText}>{tier.toUpperCase()}</Text>
                                </View>
                            </View>

                            <ScrollView contentContainerStyle={styles.scrollContent}>
                                <Text style={styles.planName}>{planData.name}</Text>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.priceValue}>₹{planData.price}</Text>
                                    <Text style={styles.pricePeriod}>/{planData.period}</Text>
                                </View>

                                <View style={styles.featuresList}>
                                    {planData.features?.map((f, i) => (
                                        <View key={i} style={styles.featureRow}>
                                            <Ionicons name="checkmark-circle" size={24} color={planData.colors?.[0] || 'white'} />
                                            <Text style={styles.featureText}>{f}</Text>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>

                            <View style={styles.footer}>
                                <TouchableOpacity style={styles.ctaBtn} onPress={handlePurchase}>
                                    <LinearGradient
                                        colors={planData.colors || [COLORS.primary, '#ff7854']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.ctaGradient}
                                    >
                                        <Text style={styles.ctaText}>Continue for ₹{planData.price}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <Text style={styles.legalText}>Recurring billing, cancel anytime.</Text>
                            </View>
                        </SafeAreaView>
                    </LinearGradient>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    loadingBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        color: 'white',
        fontSize: 18,
        marginTop: 20,
        marginBottom: 30,
        textAlign: 'center',
    },
    closeBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
    },
    closeBtnText: {
        color: 'white',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        position: 'relative',
    },
    closeIcon: {
        position: 'absolute',
        left: 20,
    },
    logoText: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
    },
    tierBadge: {
        marginLeft: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tierBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 30,
        alignItems: 'center',
    },
    planName: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 10,
        marginBottom: 40,
    },
    priceValue: {
        color: 'white',
        fontSize: 48,
        fontWeight: 'bold',
    },
    pricePeriod: {
        color: '#888',
        fontSize: 20,
    },
    featuresList: {
        width: '100%',
        gap: 20,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 15,
        flex: 1,
    },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    ctaBtn: {
        borderRadius: 30,
        overflow: 'hidden',
    },
    ctaGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    ctaText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    legalText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 15,
    }
});

export default UpgradeModal;
