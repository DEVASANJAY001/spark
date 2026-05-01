import React, { useState, useMemo, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

// A sample list of common countries and cities to provide a "drop down" experience
const WORLD_LOCATIONS = [
    { id: '1', name: 'India', type: 'Country' },
    { id: '2', name: 'Chennai, India', type: 'City' },
    { id: '3', name: 'Mumbai, India', type: 'City' },
    { id: '4', name: 'Delhi, India', type: 'City' },
    { id: '5', name: 'Bangalore, India', type: 'City' },
    { id: '6', name: 'Hyderabad, India', type: 'City' },
    { id: '7', name: 'United States', type: 'Country' },
    { id: '8', name: 'United Kingdom', type: 'Country' },
    { id: '9', name: 'Canada', type: 'Country' },
    { id: '10', name: 'Australia', type: 'Country' },
    { id: '11', name: 'Dubai, UAE', type: 'City' },
    { id: '12', name: 'Singapore', type: 'Country' },
    { id: '13', name: 'Germany', type: 'Country' },
    { id: '14', name: 'France', type: 'Country' },
    { id: '15', name: 'Japan', type: 'Country' },
    { id: '16', name: 'South Korea', type: 'Country' },
    { id: '17', name: 'Brazil', type: 'Country' },
    { id: '18', name: 'New York, USA', type: 'City' },
    { id: '19', name: 'London, UK', type: 'City' },
    { id: '20', name: 'Toronto, Canada', type: 'City' },
    { id: '21', name: 'Paris, France', type: 'City' },
    { id: '22', name: 'Berlin, Germany', type: 'City' },
    { id: '23', name: 'Tokyo, Japan', type: 'City' },
    { id: '24', name: 'Sydney, Australia', type: 'City' },
];

const LocationPickerModal = ({ visible, onClose, onSelect, initialValue }) => {
    const [search, setSearch] = useState('');
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Debounced Search for Global Locations
    useEffect(() => {
        if (!search || search.length < 2) {
            setLocations([]);
            setError(null);
            return;
        }

        const fetchLocations = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`https://api.teleport.org/api/cities/?search=${encodeURIComponent(search)}`, {
                    headers: { 'Accept': 'application/json' },
                    timeout: 5000
                });
                if (!response.ok) throw new Error('API Error');
                const data = await response.json();
                
                if (data?._embedded?.['city:search-results']) {
                    const formatted = data._embedded['city:search-results'].map((res, index) => ({
                        id: index.toString(),
                        name: res.matching_full_name,
                        type: 'City'
                    }));
                    setLocations(formatted);
                }
            } catch (err) {
                console.error('Location fetch error:', err);
                setError('Network error: Could not reach global database.');
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(fetchLocations, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.item}
            onPress={() => {
                onSelect(item.name);
                onClose();
            }}
        >
            <View style={styles.itemIcon}>
                <Ionicons 
                    name="location" 
                    size={20} 
                    color={COLORS.primary} 
                />
            </View>
            <View style={styles.itemTextContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemType}>{item.type}</Text>
            </View>
            {initialValue === item.name && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Global Search</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Type any city in the world..."
                            placeholderTextColor="#666"
                            value={search}
                            onChangeText={setSearch}
                            autoFocus
                        />
                        {loading && <ActivityIndicator color={COLORS.primary} style={{ marginRight: 10 }} />}
                        {search.length > 0 && !loading && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <Ionicons name="close-circle" size={20} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        data={search.length < 2 ? WORLD_LOCATIONS : locations}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                {error ? (
                                    <>
                                        <Ionicons name="wifi-outline" size={48} color="#444" />
                                        <Text style={[styles.emptyText, { marginTop: 10 }]}>{error}</Text>
                                        <Text style={[styles.emptyText, { fontSize: 12 }]}>You can still enter a location manually.</Text>
                                    </>
                                ) : (
                                    <Text style={styles.emptyText}>
                                        {search.length < 2 ? "Start typing to search global cities..." : loading ? "Searching..." : `No locations found for "${search}"`}
                                    </Text>
                                )}
                                
                                {search.length >= 2 && !loading && (
                                    <TouchableOpacity 
                                        style={styles.customAddBtn}
                                        onPress={() => {
                                            onSelect(search);
                                            onClose();
                                        }}
                                    >
                                        <Text style={styles.customAddText}>Use "{search}" anyway</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        margin: 15,
        paddingHorizontal: 15,
        borderRadius: 12,
        height: 50,
        borderWidth: 1,
        borderColor: '#222',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 15,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 51, 102, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemTextContent: {
        flex: 1,
    },
    itemName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    itemType: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
        marginBottom: 15,
    },
    customAddBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    customAddText: {
        color: 'white',
        fontWeight: 'bold',
    }
});

export default LocationPickerModal;
