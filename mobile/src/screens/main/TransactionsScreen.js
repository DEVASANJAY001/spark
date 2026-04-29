import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import useAuth from '../../hooks/useAuth';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const TransactionsScreen = () => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTransactions = async () => {
        try {
            const q = query(
                collection(db, 'transactions'),
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(list);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) fetchTransactions();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getIcon = (type) => {
        switch (type) {
            case 'subscription': return 'card';
            case 'coupon_redemption': return 'gift';
            default: return 'receipt';
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.transactionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={getIcon(item.type)} size={20} color={COLORS.primary} />
            </View>
            <View style={styles.details}>
                <Text style={[styles.typeText, { color: colors.text }]}>
                    {item.type.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                    {formatDate(item.createdAt)}
                </Text>
                {item.couponCode && (
                    <Text style={styles.couponTag}>Code: {item.couponCode}</Text>
                )}
            </View>
            <View style={styles.amountContainer}>
                <Text style={[styles.amountText, { color: colors.text }]}>
                    {item.amount > 0 ? `₹${item.amount}` : 'FREE'}
                </Text>
                <Text style={[styles.statusText, { color: item.status === 'completed' ? '#4CAF50' : '#FFC107' }]}>
                    {item.status}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Transaction History</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>All your payments and redemptions</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={64} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions yet</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 5,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    details: {
        flex: 1,
    },
    typeText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 12,
        marginTop: 2,
    },
    couponTag: {
        fontSize: 10,
        color: COLORS.primary,
        fontWeight: 'bold',
        marginTop: 4,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginTop: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
    }
});

export default TransactionsScreen;
