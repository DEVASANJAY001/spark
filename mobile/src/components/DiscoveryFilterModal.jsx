import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    Modal, 
    TouchableOpacity, 
    ScrollView, 
    Dimensions, 
    Switch,
    TextInput,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS } from '../constants/theme';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const DiscoveryFilterModal = ({ visible, onClose, initialFilters, onApply }) => {
    const [filters, setFilters] = useState(initialFilters || {
        maxDistance: 50,
        ageRange: [18, 35],
        interestedIn: 'Everyone',
        showFurtherAway: false,
        showSlightlyAwayAge: true,
        minPhotos: 1,
        workout: 'Sometimes',
        smoking: 'No',
        drinking: 'Socially',
        pets: 'No',
    });

    const PREDEFINED_OPTIONS = {
        workout: ['Never', 'Sometimes', 'Regularly', 'Athlete'],
        smoking: ['No', 'Socially', 'Yes'],
        drinking: ['No', 'Socially', 'Yes', 'Frequent'],
        pets: ['No', 'Cat', 'Dog', 'Both', 'Other'],
        interestedIn: ['Men', 'Women', 'Everyone'],
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const renderOptionPicker = (label, field, options) => (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>{label}</Text>
            <View style={styles.optionsRow}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt}
                        style={[
                            styles.optionBtn,
                            filters[field] === opt && styles.optionBtnActive
                        ]}
                        onPress={() => setFilters({ ...filters, [field]: opt })}
                    >
                        <Text style={[
                            styles.optionText,
                            filters[field] === opt && styles.optionTextActive
                        ]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Discovery Settings</Text>
                    <TouchableOpacity onPress={handleApply}>
                        <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Location */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>Location</Text>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Current Location</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.locationCard}>
                            <Ionicons name="location" size={20} color={COLORS.primary} />
                            <Text style={styles.locationText}>My Current Location</Text>
                        </View>
                    </View>

                    {/* Distance */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>Maximum Distance</Text>
                            <Text style={styles.valueText}>{filters.maxDistance} KM</Text>
                        </View>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={1}
                            maximumValue={160}
                            step={1}
                            value={filters.maxDistance}
                            onValueChange={(val) => setFilters({ ...filters, maxDistance: val })}
                            minimumTrackTintColor={COLORS.primary}
                            maximumTrackTintColor="rgba(255,255,255,0.2)"
                            thumbTintColor="white"
                        />
                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Show people further away if I run out</Text>
                            <Switch 
                                value={filters.showFurtherAway}
                                onValueChange={(val) => setFilters({ ...filters, showFurtherAway: val })}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                            />
                        </View>
                    </View>

                    {/* Interested In */}
                    {renderOptionPicker('Show Me', 'interestedIn', PREDEFINED_OPTIONS.interestedIn)}

                    {/* Age Range */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>Age Range</Text>
                            <Text style={styles.valueText}>{filters.ageRange[0]} - {filters.ageRange[1]}</Text>
                        </View>
                        {/* Note: Multi-slider would be better but standard slider is single. Simplified for now. */}
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={18}
                            maximumValue={80}
                            step={1}
                            value={filters.ageRange[1]}
                            onValueChange={(val) => setFilters({ ...filters, ageRange: [filters.ageRange[0], val] })}
                            minimumTrackTintColor={COLORS.primary}
                            maximumTrackTintColor="rgba(255,255,255,0.2)"
                            thumbTintColor="white"
                        />
                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Show people slightly away from my range</Text>
                            <Switch 
                                value={filters.showSlightlyAwayAge}
                                onValueChange={(val) => setFilters({ ...filters, showSlightlyAwayAge: val })}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                            />
                        </View>
                    </View>

                    {/* Minimum Photos */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>Minimum Photos</Text>
                            <Text style={styles.valueText}>{filters.minPhotos}</Text>
                        </View>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={1}
                            maximumValue={6}
                            step={1}
                            value={filters.minPhotos}
                            onValueChange={(val) => setFilters({ ...filters, minPhotos: val })}
                            minimumTrackTintColor={COLORS.primary}
                            maximumTrackTintColor="rgba(255,255,255,0.2)"
                            thumbTintColor="white"
                        />
                    </View>

                    {/* Lifestyles */}
                    {renderOptionPicker('Workout', 'workout', PREDEFINED_OPTIONS.workout)}
                    {renderOptionPicker('Smoking', 'smoking', PREDEFINED_OPTIONS.smoking)}
                    {renderOptionPicker('Drinking', 'drinking', PREDEFINED_OPTIONS.drinking)}
                    {renderOptionPicker('Pets', 'pets', PREDEFINED_OPTIONS.pets)}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 4,
    },
    applyBtnText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionLabel: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    valueText: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    linkText: {
        color: COLORS.primary,
        fontSize: 14,
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 12,
        gap: 10,
    },
    locationText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    toggleLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        flex: 1,
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    optionBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    optionText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    optionTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    customBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 12,
        gap: 10,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    customBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    }
});

export default DiscoveryFilterModal;
