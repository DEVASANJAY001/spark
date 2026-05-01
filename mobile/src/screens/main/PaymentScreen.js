import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, StatusBar, Platform, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import useAuth from '../../hooks/useAuth';
import { useNavigation, useRoute } from '@react-navigation/native';
import { userService } from '../../services/userService';
import { doc, setDoc, serverTimestamp, collection, addDoc, query, where, getDocs, increment, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { couponService } from '../../services/couponService';

const PaymentScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { plan } = route.params || {};
    const { user, updateProfile } = useAuth();

    const [code, setCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    if (!plan) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No plan selected.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backLink}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const originalPrice = typeof plan.price === 'string' 
        ? parseInt(plan.price.replace('₹', '')) 
        : (plan.price || 0);
    const finalPrice = Math.max(0, originalPrice - discount);

    const validateCode = async () => {
        if (!code) return;
        setIsValidating(true);
        try {
            const coupon = await couponService.validateCoupon(code);
            
            // Calculate discount
            let discAmt = 0;
            const discVal = parseFloat(coupon.discount.replace(/[^0-9.]/g, ''));
            
            if (coupon.discount.includes('%')) {
                discAmt = Math.floor(originalPrice * (discVal / 100));
            } else {
                discAmt = discVal;
            }

            setDiscount(discAmt);
            Alert.alert('Success', `Code applied! ${coupon.discount} discount.`);
        } catch (error) {
            Alert.alert('Invalid Code', error.message || 'The referral or redeem code is invalid.');
            setDiscount(0);
        } finally {
            setIsValidating(false);
        }
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            if (finalPrice === 0) {
                // ₹0 Transaction - Direct Activation
                await activateSubscription('PROMO_CODE');
            } else {
                // Simulate Payment Gateway
                setTimeout(async () => {
                    await activateSubscription('GATEWAY');
                }, 2000);
            }
        } catch (error) {
            console.error('Payment Error:', error);
            Alert.alert('Error', 'Failed to process payment. Please try again.');
            setIsProcessing(false);
        }
    };

    const activateSubscription = async (method) => {
        console.log(`[Payment] Activating subscription for plan: ${plan?.name} (${plan?.id})`);
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month validity

        const transactionData = {
            uid: user.uid,
            type: 'subscription',
            planId: plan.id,
            planName: plan.name,
            amount: finalPrice,
            discount,
            code: code.toUpperCase(),
            method,
            status: 'completed',
            createdAt: serverTimestamp(),
            expiryDate: expiryDate.toISOString()
        };

        // 1. Record Transaction
        await addDoc(collection(db, 'transactions'), transactionData);

        // 2. Update User Profile
        await updateProfile({
            hasPremium: true,
            premiumTier: plan.id,
            premiumFeatures: plan.features || [], // Save features for adService/logic
            premiumExpiry: expiryDate.toISOString(),
            superLikes: plan.id === 'platinum' ? 10 : (plan.id === 'gold' ? 5 : 0),
            boosts: plan.id === 'gold' || plan.id === 'platinum' ? 1 : 0
        });

        // 3. Increment Coupon Usage if used
        if (discount > 0 && code) {
            try {
                const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    await updateDoc(doc(db, 'coupons', snap.docs[0].id), {
                        usage: increment(1)
                    });
                }
            } catch (e) {
                console.warn('Could not update coupon usage:', e);
            }
        }

        setShowSuccessModal(true);
        setIsProcessing(false);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{plan.name}</Text>
                        <Text style={styles.summaryValue}>{plan.price}</Text>
                    </View>
                    {discount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.discountLabel}>Discount Applied</Text>
                            <Text style={styles.discountValue}>-₹{discount}</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>{finalPrice === 0 ? 'FREE' : `₹${finalPrice}`}</Text>
                    </View>
                </View>

                <View style={styles.codeSection}>
                    <Text style={styles.codeTitle}>Have a Referral or Redeem Code?</Text>
                    <View style={styles.codeInputRow}>
                        <TextInput
                            style={styles.codeInput}
                            placeholder="Enter code here"
                            placeholderTextColor="#666"
                            value={code}
                            onChangeText={setCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={[styles.applyButton, !code && styles.buttonDisabled]}
                            onPress={validateCode}
                            disabled={!code || isValidating}
                        >
                            {isValidating ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.applyButtonText}>Apply</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.paymentMethods}>
                    <Text style={styles.paymentTitle}>Payment Method</Text>
                    {finalPrice === 0 ? (
                        <View style={styles.promoIndicator}>
                            <Ionicons name="gift" size={24} color={COLORS.primary} />
                            <Text style={styles.promoText}>Promo code applied. Payment gateway skipped.</Text>
                        </View>
                    ) : (
                        <View style={styles.gatewayPlaceholder}>
                            <Ionicons name="card" size={32} color="#888" />
                            <Text style={styles.gatewayText}>Secure Payment Gateway</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.payButton, isProcessing && styles.buttonDisabled]}
                    onPress={handlePayment}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.payButtonText}>
                            {finalPrice === 0 ? 'Activate Subscription' : `Pay ₹${finalPrice}`}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Premium Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={[styles.successCard, { backgroundColor: '#1a1a1a' }]}>
                        <View style={styles.successIconWrapper}>
                            <LinearGradient
                                colors={['#00FF88', '#00BD63']}
                                style={styles.successIconGradient}
                            >
                                <Ionicons name="checkmark" size={40} color="white" />
                            </LinearGradient>
                        </View>
                        
                        <Text style={styles.successTitle}>Subscription Activated!</Text>
                        <Text style={styles.successSub}>
                            Welcome to {plan.name}! Your account has been upgraded with all premium features.
                        </Text>
                        
                        <TouchableOpacity 
                            style={styles.modalActionBtn}
                            onPress={() => {
                                setShowSuccessModal(false);
                                navigation.navigate('Main', { screen: 'Profile' });
                            }}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#FF3366']}
                                style={styles.modalActionGradient}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.modalActionText}>Let's Spark!</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#000',
    },
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.m },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
    content: { padding: SPACING.m },
    summaryCard: { 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        borderRadius: 24, 
        padding: 24, 
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    summaryTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { color: '#888', fontSize: 14 },
    summaryValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    discountLabel: { color: COLORS.primary, fontSize: 14 },
    discountValue: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
    totalRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' },
    totalLabel: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    totalValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    codeSection: { marginBottom: 30 },
    codeTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
    codeInputRow: { flexDirection: 'row', gap: 10 },
    codeInput: { flex: 1, backgroundColor: '#111', borderRadius: 10, padding: 12, color: 'white', borderWidth: 1, borderColor: '#333' },
    applyButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, borderRadius: 10, justifyContent: 'center' },
    applyButtonText: { color: 'white', fontWeight: 'bold' },
    paymentMethods: { marginTop: 10 },
    paymentTitle: { color: '#888', fontSize: 14, marginBottom: 15 },
    gatewayPlaceholder: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 20, borderRadius: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#444' },
    gatewayText: { color: '#888', marginLeft: 15, fontSize: 16 },
    promoIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(253, 38, 125, 0.1)', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: COLORS.primary },
    promoText: { color: 'white', marginLeft: 12, fontSize: 14, flex: 1 },
    footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#222' },
    payButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 30, alignItems: 'center' },
    payButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    buttonDisabled: { opacity: 0.5 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    errorText: { color: 'white', fontSize: 16, marginBottom: 20 },
    backLink: { color: COLORS.primary, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successCard: {
        width: '100%',
        borderRadius: 35,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    successIconWrapper: {
        marginBottom: 20,
    },
    successIconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00FF88',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10,
    },
    successSub: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    modalActionBtn: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
    },
    modalActionGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalActionText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
    },
});

export default PaymentScreen;
