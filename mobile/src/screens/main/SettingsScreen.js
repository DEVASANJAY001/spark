import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Switch,
    Dimensions,
    Alert,
    Platform,
    Share,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { COLORS, SPACING } from '../../constants/theme';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/userService';

import OptionPickerModal from '../../components/OptionPickerModal';
import UsernameModal from '../../components/UsernameModal';
import LocationPickerModal from '../../components/LocationPickerModal';

const { width } = Dimensions.get('window');

const SettingsScreen = ({ navigation }) => {
    const { user, profile, updateProfile, logout } = useAuth();
    const { colors, isDark, toggleTheme } = useTheme();

    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', field: '', options: [] });
    const [usernameVisible, setUsernameVisible] = useState(false);
    const [locationPickerVisible, setLocationPickerVisible] = useState(false);

    // Local state for sliders to prevent lag
    const [maxDistance, setMaxDistance] = useState(profile?.maxDistance || 50);
    const [ageRange, setAgeRange] = useState({ min: profile?.ageMin || 18, max: profile?.ageMax || 75 });

    // Sync sliders with debounce
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (maxDistance !== profile?.maxDistance) updateProfile({ maxDistance });
        }, 1000);
        return () => clearTimeout(timeout);
    }, [maxDistance]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (ageRange.min !== profile?.ageMin || ageRange.max !== profile?.ageMax) {
                updateProfile({ ageMin: ageRange.min, ageMax: ageRange.max });
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }, [ageRange]);

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: logout }
        ]);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: 'Check out Spark - Find your perfect match!',
                url: 'https://sparkapp.com'
            });
        } catch (error) {
            console.error(error.message);
        }
    };

    const openPicker = (title, field, options) => {
        setPickerConfig({ title, field, options });
        setPickerVisible(true);
    };

    // ── Components ────────────────────────────────────────────────────────────

    const SettingHeader = ({ title }) => (
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
    );

    const SettingItem = ({ icon, label, value, onPress, showArrow = true, color }) => (
        <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface }]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.settingItemLeft}>
                <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
                    <Ionicons name={icon} size={20} color={color || COLORS.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
            </View>
            <View style={styles.settingItemRight}>
                {value && <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>}
                {showArrow && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ opacity: 0.3 }} />}
            </View>
        </TouchableOpacity>
    );

    const SettingToggle = ({ icon, label, value, onValueChange, color }) => (
        <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingItemLeft}>
                <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
                    <Ionicons name={icon} size={20} color={color || COLORS.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#333', true: COLORS.primary }}
                thumbColor={Platform.OS === 'ios' ? 'white' : value ? 'white' : '#888'}
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Discovery Section */}
                <SettingHeader title="Discovery Settings" />
                <View style={styles.sectionGroup}>
                    <SettingItem 
                        icon="location" 
                        label="Discovery Location" 
                        value={profile?.city || 'India'} 
                        onPress={() => setLocationPickerVisible(true)} 
                    />
                    <SettingToggle 
                        icon="globe-outline" 
                        label="Global Mode" 
                        value={profile?.globalMode} 
                        onValueChange={(val) => updateProfile({ globalMode: val })} 
                    />
                </View>

                {/* Preferences Section */}
                <SettingHeader title="Preferences" />
                <View style={[styles.prefCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.prefHeader}>
                        <Text style={[styles.prefLabel, { color: colors.text }]}>Distance Range</Text>
                        <Text style={[styles.prefValue, { color: COLORS.primary }]}>{maxDistance} mi.</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={100}
                        step={1}
                        value={maxDistance}
                        onValueChange={setMaxDistance}
                        minimumTrackTintColor={COLORS.primary}
                        maximumTrackTintColor={colors.border}
                        thumbTintColor="white"
                    />
                </View>

                <View style={[styles.prefCard, { backgroundColor: colors.surface, marginTop: 15 }]}>
                    <View style={styles.prefHeader}>
                        <Text style={[styles.prefLabel, { color: colors.text }]}>Age Range</Text>
                        <Text style={[styles.prefValue, { color: COLORS.primary }]}>{ageRange.min} - {ageRange.max}</Text>
                    </View>
                    <View style={styles.sliderGroup}>
                        <Slider
                            style={styles.slider}
                            minimumValue={18}
                            maximumValue={ageRange.max}
                            step={1}
                            value={ageRange.min}
                            onValueChange={(val) => setAgeRange(prev => ({ ...prev, min: val }))}
                            minimumTrackTintColor={COLORS.primary}
                            maximumTrackTintColor={colors.border}
                            thumbTintColor="white"
                        />
                        <Slider
                            style={styles.slider}
                            minimumValue={ageRange.min}
                            maximumValue={75}
                            step={1}
                            value={ageRange.max}
                            onValueChange={(val) => setAgeRange(prev => ({ ...prev, max: val }))}
                            minimumTrackTintColor={COLORS.primary}
                            maximumTrackTintColor={colors.border}
                            thumbTintColor="white"
                        />
                    </View>
                </View>

                <View style={[styles.sectionGroup, { marginTop: 15 }]}>
                    <SettingItem 
                        icon="options-outline" 
                        label="Interested In" 
                        value={profile?.interestedIn || 'Everyone'} 
                        onPress={() => openPicker("Interested In", "interestedIn", ['Men', 'Women', 'Everyone'])} 
                    />
                </View>

                {/* Account Section */}
                <SettingHeader title="Account Settings" />
                <View style={styles.sectionGroup}>
                    <SettingItem 
                        icon="at-outline" 
                        label="Username" 
                        value={profile?.username ? `@${profile.username}` : 'Claim Yours'} 
                        onPress={() => setUsernameVisible(true)} 
                    />
                    <SettingItem 
                        icon="call-outline" 
                        label="Phone Number" 
                        value={profile?.phoneNumber || 'Add Phone'} 
                        onPress={() => Alert.alert("Coming Soon", "Phone verification is being integrated.")} 
                    />
                    <SettingItem 
                        icon="mail-outline" 
                        label="Email" 
                        value={user?.email} 
                        showArrow={false}
                    />
                </View>

                {/* App Settings */}
                <SettingHeader title="App Settings" />
                <View style={styles.sectionGroup}>
                    <SettingToggle 
                        icon={isDark ? "moon" : "sunny"} 
                        label="Dark Mode" 
                        value={isDark} 
                        onValueChange={toggleTheme} 
                        color="#FFD700"
                    />
                    <SettingItem 
                        icon="play-circle-outline" 
                        label="Autoplay Videos" 
                        value={profile?.autoplayMode || 'Wi-Fi Only'} 
                        onPress={() => openPicker("Autoplay Videos", "autoplayMode", ['Always', 'Wi-Fi Only', 'Never'])} 
                    />
                </View>

                {/* Platinum Features */}
                <SettingHeader title="Platinum Elite Features" />
                <View style={styles.sectionGroup}>
                    <SettingToggle 
                        icon="eye-off-outline" 
                        label="Incognito Mode" 
                        value={profile?.incognitoMode} 
                        onValueChange={(val) => {
                            if (userService.canUseFeature(profile, 'incognito_mode')) {
                                updateProfile({ incognitoMode: val });
                            } else {
                                Alert.alert('Platinum Elite', 'Upgrade to Platinum to browse profiles anonymously!', [
                                    { text: 'Later' },
                                    { text: 'Upgrade', onPress: () => navigation.navigate('Subscriptions') }
                                ]);
                            }
                        }} 
                        color="#E5E4E2"
                    />
                </View>

                {/* Payments & History */}
                <SettingHeader title="Payments & History" />
                <View style={styles.sectionGroup}>
                    <SettingItem 
                        icon="receipt-outline" 
                        label="Payment History" 
                        onPress={() => navigation.navigate('Transactions')} 
                    />
                </View>

                {/* Privacy & Legal */}
                <SettingHeader title="Privacy & Legal" />
                <View style={styles.sectionGroup}>
                    <SettingItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => navigation.navigate('StaticContent', { type: 'privacy_policy' })} />
                    <SettingItem icon="document-text-outline" label="Terms of Service" onPress={() => navigation.navigate('StaticContent', { type: 'terms_of_service' })} />
                    <SettingItem icon="refresh-circle-outline" label="Refund & Return Policy" onPress={() => navigation.navigate('StaticContent', { type: 'refund_policy' })} />
                    <SettingItem icon="business-outline" label="DAVNS INDUSTRIES" onPress={() => navigation.navigate('StaticContent', { type: 'about_davns' })} />
                </View>

                {/* Support */}
                <SettingHeader title="Support" />
                <View style={styles.sectionGroup}>
                    <SettingItem icon="help-circle-outline" label="Help Center" onPress={() => navigation.navigate('SupportTickets')} />
                    <SettingItem icon="share-social-outline" label="Share Spark" onPress={handleShare} />
                </View>

                <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.border }]} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FF3366" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Ionicons name="sparkles" size={32} color={colors.border} />
                    <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version {Constants.expoConfig?.version || '2.1.4'}</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Modals */}
            <OptionPickerModal
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                title={pickerConfig.title}
                options={pickerConfig.options}
                selectedValue={profile?.[pickerConfig.field]}
                onSelect={(val) => {
                    updateProfile({ [pickerConfig.field]: val });
                    setPickerVisible(false);
                }}
            />

            <UsernameModal
                visible={usernameVisible}
                onClose={() => setUsernameVisible(false)}
                uid={user?.uid}
                currentUsername={profile?.username}
            />

            <LocationPickerModal
                visible={locationPickerVisible}
                onClose={() => setLocationPickerVisible(false)}
                initialValue={profile?.city}
                onSelect={(city) => updateProfile({ city })}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        height: 60,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: { paddingHorizontal: 15, paddingBottom: 50 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 30,
        marginBottom: 10,
        marginLeft: 5,
    },
    sectionGroup: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 1,
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    settingItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        fontSize: 14,
        fontWeight: '500',
        marginRight: 8,
    },
    prefCard: {
        padding: 16,
        borderRadius: 16,
    },
    prefHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    prefLabel: {
        fontSize: 15,
        fontWeight: '700',
    },
    prefValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    slider: {
        width: '100%',
        height: 30,
    },
    sliderGroup: {
        gap: 10,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 40,
        gap: 10,
    },
    logoutText: {
        color: '#FF3366',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginTop: 50,
        opacity: 0.5,
    },
    versionText: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 10,
    }
});

export default SettingsScreen;
