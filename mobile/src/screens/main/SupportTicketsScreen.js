import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import useAuth from '../../hooks/useAuth';
import { supportService } from '../../services/supportService';

const SupportTicketsScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = supportService.getUserTickets(user.uid, (data) => {
            setTickets(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return '#FF4D4D';
            case 'responded': return '#4D94FF';
            case 'resolved': return '#4CAF50';
            default: return '#888';
        }
    };

    const renderTicket = ({ item }) => (
        <TouchableOpacity
            style={styles.ticketCard}
            onPress={() => navigation.navigate('TicketChat', { ticket: item })}
        >
            <View style={styles.ticketHeader}>
                <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
                </View>
            </View>
            <Text style={styles.ticketMessage} numberOfLines={2}>{item.message}</Text>
            <View style={styles.ticketFooter}>
                <Text style={styles.ticketDate}>
                    {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                </Text>
                <View style={styles.replyCount}>
                    <Ionicons name="chatbubble-outline" size={14} color="#666" />
                    <Text style={styles.replyCountText}>{item.replies?.length || 0} replies</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Support Tickets</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('SupportTicket')}
                >
                    <Ionicons name="add" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={tickets}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTicket}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="help-circle-outline" size={64} color="#333" />
                            <Text style={styles.emptyText}>No support tickets yet.</Text>
                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() => navigation.navigate('SupportTicket')}
                            >
                                <Text style={styles.createBtnText}>Create Ticket</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#222'
    },
    backButton: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    addButton: { padding: 5 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: SPACING.m },
    ticketCard: {
        backgroundColor: '#111',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222'
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    ticketSubject: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 10
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    ticketMessage: {
        color: '#888',
        fontSize: 14,
        marginBottom: 15
    },
    ticketFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    ticketDate: {
        color: '#444',
        fontSize: 12
    },
    replyCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    replyCountText: {
        color: '#666',
        fontSize: 12
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        marginTop: 20,
        marginBottom: 30
    },
    createBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25
    },
    createBtnText: {
        color: 'white',
        fontWeight: 'bold'
    }
});

export default SupportTicketsScreen;
