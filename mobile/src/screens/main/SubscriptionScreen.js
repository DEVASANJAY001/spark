import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, SafeAreaView, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { TextInput, Alert } from 'react-native';
import { couponService } from '../../services/couponService';
import useAuth from '../../hooks/useAuth';

const { width } = Dimensions.get('window');

const SubscriptionScreen = () => {
    const navigation = useNavigation();
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                // Simplified query without orderBy to avoid index issues initially
                const querySnapshot = await getDocs(collection(db, 'plans'));
                const fetchedPlans = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Sort manually in JS
                fetchedPlans.sort((a, b) => (a.price || 0) - (b.price || 0));
                
                setPlans(fetchedPlans);
                if (fetchedPlans.length > 0) {
                    setSelectedPlan(fetchedPlans[1] || fetchedPlans[0]);
                }
            } catch (error) {
                console.error('Error fetching plans:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    const handleRedeem = async () => {
        if (!couponCode.trim()) return;
        
        setRedeeming(true);
        try {
            const result = await couponService.redeemCoupon(user.uid, couponCode);
            Alert.alert('Success', result.message);
            setCouponCode('');
            // Optional: Refresh profile or navigate away
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to redeem coupon');
        } finally {
            setRedeeming(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (plans.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={COLORS.grey} />
                <Text style={styles.errorText}>No subscription plans found.</Text>
                <Text style={styles.errorSubtext}>Please initialize plans from the Web Admin portal.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Upgrade Your Experience</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.tagline}>Unlock premium features and find your perfect match faster.</Text>

                {/* Redeem Section */}
                <View style={styles.redeemSection}>
                    <Text style={styles.redeemTitle}>Have a promo code?</Text>
                    <View style={styles.redeemInputWrapper}>
                        <TextInput
                            style={styles.redeemInput}
                            placeholder="Enter Code"
                            placeholderTextColor="#666"
                            value={couponCode}
                            onChangeText={setCouponCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity 
                            style={[styles.redeemBtn, !couponCode.trim() && { opacity: 0.5 }]} 
                            onPress={handleRedeem}
                            disabled={redeeming || !couponCode.trim()}
                        >
                            {redeeming ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.redeemBtnText}>Apply</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.plansContainer}>
                    {plans.map((plan) => (
                        <TouchableOpacity
                            key={plan.id}
                            style={[
                                styles.planCard,
                                selectedPlan.id === plan.id && { borderColor: plan.colors[0], borderWidth: 2 }
                            ]}
                            onPress={() => setSelectedPlan(plan)}
                        >
                            {plan.popular && (
                                <View style={[styles.popularBadge, { backgroundColor: plan.colors[0] }]}>
                                    <Text style={styles.popularText}>MOST POPULAR</Text>
                                </View>
                            )}
                            <View style={styles.planHeader}>
                                <Text style={styles.planName}>{plan.name}</Text>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.planPrice}>₹{plan.price}</Text>
                                    <Text style={styles.planPeriod}>/{plan.period}</Text>
                                </View>
                            </View>
                            <View style={styles.featuresList}>
                                {plan.features.slice(0, 3).map((feature, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <Ionicons name="checkmark-circle" size={18} color={plan.colors[0]} />
                                        <Text style={styles.featureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.benefitsSection}>
                    <Text style={styles.benefitsTitle}>Full Plan Benefits</Text>
                    {selectedPlan.features.map((feature, i) => (
                        <View key={i} style={styles.benefitRow}>
                            <Ionicons name="star" size={20} color={selectedPlan.colors[0]} />
                            <Text style={styles.benefitText}>{feature}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.subscribeButton}
                    onPress={() => navigation.navigate('Payment', { plan: selectedPlan })}
                >
                    <LinearGradient
                        colors={selectedPlan.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.subscribeText}>Select {selectedPlan.name}</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.legalText}>Recurring billing, cancel anytime.</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: 15,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    scrollContent: {
        paddingHorizontal: SPACING.m,
        paddingBottom: 150,
    },
    tagline: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 20,
        lineHeight: 22,
    },
    plansContainer: {
        gap: 15,
    },
    planCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    popularText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    planName: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    planPrice: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    planPeriod: {
        color: '#888',
        fontSize: 14,
    },
    featuresList: {
        gap: 8,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureText: {
        color: '#ccc',
        fontSize: 14,
        marginLeft: 10,
    },
    benefitsSection: {
        marginTop: 40,
        padding: 24,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    benefitsTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    benefitText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 15,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    subscribeButton: {
        borderRadius: 30,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    subscribeText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    legalText: {
        color: '#555',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 10,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
    },
    errorSubtext: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryText: {
        color: 'white',
        fontWeight: 'bold',
    },
    redeemSection: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    redeemTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    redeemInputWrapper: {
        flexDirection: 'row',
        gap: 10,
    },
    redeemInput: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        color: 'white',
        fontSize: 16,
    },
    redeemBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    redeemBtnText: {
        color: 'white',
        fontWeight: 'bold',
    }
});

export default SubscriptionScreen;
