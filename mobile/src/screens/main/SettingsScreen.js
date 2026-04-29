import React, { useState, useEffect, useCallback } from 'react';
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
    Image,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { COLORS, SPACING } from '../../constants/theme';
import useAuth from '../../hooks/useAuth';
import UpgradeModal from '../../components/UpgradeModal';
import OptionPickerModal from '../../components/OptionPickerModal';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import UsernameModal from '../../components/UsernameModal';

const { width } = Dimensions.get('window');

const SettingsScreen = ({ navigation }) => {
    const { user, profile, updateProfile, logout, deleteAccount } = useAuth();

    const [upgradeVisible, setUpgradeVisible] = useState(false);
    const [upgradeTier, setUpgradeTier] = useState('plus');
    const [pickerVisible, setPickerVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', field: '', options: [] });
    const [usernameVisible, setUsernameVisible] = useState(false);

    // Local state for sliders/toggles to avoid lag
    const [maxDistance, setMaxDistance] = useState(profile?.maxDistance || 50);
    const [ageRange, setAgeRange] = useState({ min: profile?.ageMin || 18, max: profile?.ageMax || 75 });

    // Debounced sync for sliders
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (maxDistance !== profile?.maxDistance) {
                updateProfile({ maxDistance });
            }
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

    const openUpgrade = (tier) => {
        setUpgradeTier(tier);
        setUpgradeVisible(true);
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to log out?")) {
                logout();
            }
        } else {
            Alert.alert(
                "Logout",
                "Are you sure you want to log out?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Logout", style: "destructive", onPress: async () => await logout() }
                ]
            );
        }
    };

    const handleDeleteAccount = () => {
        setDeleteModalVisible(true);
    };

    const onConfirmDelete = async () => {
        try {
            await deleteAccount();
            setDeleteModalVisible(false);
            if (Platform.OS === 'web') {
                alert("Account Deleted: Your account and all associated data have been permanently removed.");
            } else {
                Alert.alert("Account Deleted", "Your account and all associated data have been permanently removed.");
            }
        } catch (err) {
            if (Platform.OS === 'web') {
                alert("Error: Failed to delete account. You may need to re-authenticate first.");
            } else {
                Alert.alert("Error", "Failed to delete account. You may need to re-authenticate first.");
            }
            throw err;
        }
    };

    const openPicker = (title, field, options) => {
        setPickerConfig({ title, field, options });
        setPickerVisible(true);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
        </View>
    );

    const renderSubscriptionCards = () => (
        <View style={styles.section}>
            <TouchableOpacity style={styles.upgradeCard} onPress={() => openUpgrade('platinum')}>
                <View style={styles.upgradeHeader}>
                    <Text style={styles.upgradeLogo}>Spark</Text>
                    <View style={[styles.tierBadge, { backgroundColor: '#E5E4E2' }]}>
                        <Text style={styles.tierBadgeText}>PLATINUM</Text>
                    </View>
                </View>
                <Text style={styles.upgradeTagline}>Priority Likes, See who Likes you & More</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.upgradeCard} onPress={() => openUpgrade('gold')}>
                <View style={styles.upgradeHeader}>
                    <Text style={styles.upgradeLogo}>Spark</Text>
                    <View style={[styles.tierBadge, { backgroundColor: '#D4AF37' }]}>
                        <Text style={styles.tierBadgeText}>GOLD</Text>
                    </View>
                </View>
                <Text style={styles.upgradeTagline}>See who Likes You & More!</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.upgradeCard} onPress={() => openUpgrade('plus')}>
                <View style={styles.upgradeHeader}>
                    <Text style={styles.upgradeLogo}>Spark</Text>
                    <View style={[styles.tierBadge, { backgroundColor: '#ff006e' }]}>
                        <Text style={styles.tierBadgeText}>+</Text>
                    </View>
                </View>
                <Text style={styles.upgradeTagline}>Unlimited Likes & More!</Text>
            </TouchableOpacity>
        </View>
    );

    const renderQuickActions = () => (
        <View style={styles.quickActionGrid}>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => openUpgrade('gold')}>
                <Ionicons name="star" size={24} color={COLORS.blue} />
                <Text style={styles.quickActionLabel}>Get Super Likes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => openUpgrade('gold')}>
                <Ionicons name="flash" size={24} color="#a15df9" />
                <Text style={styles.quickActionLabel}>Get Boosts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => openUpgrade('plus')}>
                <Ionicons name="eye-off" size={24} color="white" />
                <Text style={styles.quickActionLabel}>Go Incognito</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => openUpgrade('plus')}>
                <Ionicons name="navigate" size={24} color="#ff006e" />
                <Text style={styles.quickActionLabel}>Passport™ Mode</Text>
            </TouchableOpacity>
        </View>
    );

    const renderSectionLabel = (label) => (
        <Text style={styles.sectionLabel}>{label}</Text>
    );

    const renderSettingRow = (label, value, onPress, showArrow = true, color = 'white') => (
        <TouchableOpacity style={styles.settingRow} onPress={onPress}>
            <Text style={[styles.settingLabel, { color }]}>{label}</Text>
            <View style={styles.settingRight}>
                {value ? <Text style={styles.settingValue}>{value}</Text> : null}
                {showArrow && <Ionicons name="chevron-forward" size={18} color="#444" />}
            </View>
        </TouchableOpacity>
    );

    const renderToggleRow = (label, value, onValueChange, description = null) => (
        <View style={styles.groupedCard}>
            <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{label}</Text>
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#333', true: COLORS.primary }}
                />
            </View>
            {description && <Text style={styles.settingHelper}>{description}</Text>}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {renderSubscriptionCards()}
                {renderQuickActions()}

                {renderSectionLabel("Account Settings")}
                <View style={styles.groupedCard}>
                    {renderSettingRow("Phone Number", profile?.phoneNumber || "Verify now", () => { })}
                    {renderSettingRow("Transaction History", "", () => navigation.navigate('Transactions'))}
                </View>
                <Text style={styles.settingHelper}>Verify a Phone Number to help secure your account.</Text>

                {renderSectionLabel("Discovery Settings")}
                <View style={styles.groupedCard}>
                    <View style={styles.p15}>
                        <Text style={styles.innerLabel}>Location</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={20} color={COLORS.primary} />
                            <Text style={styles.locationText}>Chennai, India</Text>
                        </View>
                        <TouchableOpacity style={styles.addLocationBtn}>
                            <Text style={styles.addLocationText}>Add a new location</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.settingHelper}>Change locations to find matches anywhere.</Text>

                <View style={styles.groupedCard}>
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Global</Text>
                        <Switch
                            value={profile?.globalMode}
                            onValueChange={(val) => updateProfile({ globalMode: val })}
                            trackColor={{ false: '#333', true: COLORS.primary }}
                        />
                    </View>
                </View>
                <Text style={styles.settingHelper}>Going global will allow you to see people nearby and from around the world.</Text>

                <View style={styles.groupedCard}>
                    <View style={styles.p15}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.innerLabel}>Maximum Distance</Text>
                            <Text style={styles.valueText}>{maxDistance}mi.</Text>
                        </View>
                        <Slider
                            style={{ width: '100%', height: 40, marginTop: 10 }}
                            minimumValue={1}
                            maximumValue={100}
                            step={1}
                            value={maxDistance}
                            onValueChange={setMaxDistance}
                            minimumTrackTintColor={COLORS.primary}
                            maximumTrackTintColor="#333"
                            thumbTintColor="white"
                        />
                        <View style={styles.settingRow}>
                            <Text style={{ color: 'white', flex: 1 }}>Show people further away if I run out of profiles to see</Text>
                            <Switch
                                value={profile?.showFurtherIfEmpty}
                                onValueChange={(val) => updateProfile({ showFurtherIfEmpty: val })}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.groupedCard}>
                    {renderSettingRow("Interested In", profile?.interestedIn || "Women", () => openPicker("Interested In", "interestedIn", ['Men', 'Women', 'Everyone']))}
                </View>

                <View style={styles.groupedCard}>
                    <View style={styles.p15}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.innerLabel}>Age Range</Text>
                            <Text style={styles.valueText}>{ageRange.min} - {ageRange.max}</Text>
                        </View>

                        <View style={styles.mt10}>
                            <Text style={styles.sliderSubLabel}>Min Age: {ageRange.min}</Text>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={18}
                                maximumValue={ageRange.max}
                                step={1}
                                value={ageRange.min}
                                onValueChange={(val) => setAgeRange(prev => ({ ...prev, min: val }))}
                                minimumTrackTintColor={COLORS.primary}
                                maximumTrackTintColor="#333"
                                thumbTintColor="white"
                            />

                            <Text style={[styles.sliderSubLabel, { marginTop: 10 }]}>Max Age: {ageRange.max}</Text>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={ageRange.min}
                                maximumValue={75}
                                step={1}
                                value={ageRange.max}
                                onValueChange={(val) => setAgeRange(prev => ({ ...prev, max: val }))}
                                minimumTrackTintColor={COLORS.primary}
                                maximumTrackTintColor="#333"
                                thumbTintColor="white"
                            />
                        </View>

                        <View style={styles.settingRow}>
                            <Text style={{ color: 'white', flex: 1 }}>Show people slightly out of range if I run out of profiles</Text>
                            <Switch
                                value={profile?.showOutOfRangeIfEmpty}
                                onValueChange={(val) => updateProfile({ showOutOfRangeIfEmpty: val })}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.upsellBanner} onPress={() => openUpgrade('gold')}>
                    <View style={styles.upsellContent}>
                        <Text style={styles.upsellTitle}>Unlock more Preferences...</Text>
                        <Text style={styles.upsellBody}>Want more personalization? Set your Premium Preferences.</Text>
                    </View>
                    <View style={styles.unlockBtn}>
                        <Text style={styles.unlockBtnText}>Unlock</Text>
                    </View>
                </TouchableOpacity>

                {renderSectionLabel("Control Who You See")}
                {renderSectionLabel("Profile Attribute Filters")}
                <View style={styles.groupedCard}>
                    {[
                        { icon: 'globe-outline', label: 'Add languages' },
                        { icon: 'moon-outline', label: 'Zodiac' },
                        { icon: 'people-outline', label: 'Family Plans' },
                        { icon: 'chatbubbles-outline', label: 'Communication Style' },
                        { icon: 'heart-outline', label: 'Love Style' },
                        { icon: 'paw-outline', label: 'Pets' },
                        { icon: 'beer-outline', label: 'Drinking' },
                        { icon: 'wine-outline', label: 'Smoking' },
                        { icon: 'barbell-outline', label: 'Workout' },
                        { icon: 'at-outline', label: 'Social Media' },
                    ].map((item, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.attributeRow}
                            onPress={() => setUpgradeVisible(true)}
                        >
                            <View style={styles.row}>
                                <Ionicons name={item.icon} size={20} color="#888" />
                                <Text style={styles.attributeLabel}>{item.label}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.settingValue}>Select</Text>
                                <Ionicons name="chevron-forward" size={20} color="#444" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {renderSectionLabel("Control Who You See")}
                <View style={styles.premiumHeader}>
                    <Text style={styles.premiumHeaderText}>Control Who You See</Text>
                    <View style={styles.plusBadge}>
                        <Text style={styles.plusBadgeText}>Spark Plus®</Text>
                    </View>
                </View>
                <View style={styles.groupedCard}>
                    <TouchableOpacity style={styles.radioRow} onPress={() => updateProfile({ discoveryMode: 'balanced' })}>
                        <View style={styles.flex1}>
                            <Text style={styles.settingLabel}>Balanced Recommendations</Text>
                            <Text style={styles.subLabel}>See the most relevant people to you (default setting)</Text>
                        </View>
                        {profile?.discoveryMode === 'balanced' && <Ionicons name="checkmark" size={24} color={COLORS.primary} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.radioRow} onPress={() => openUpgrade('plus')}>
                        <View style={styles.flex1}>
                            <Text style={styles.settingLabel}>Recently Active</Text>
                            <Text style={styles.subLabel}>See the most recently active people first</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {renderSectionLabel("Control My Visibility")}
                <View style={styles.groupedCard}>
                    <TouchableOpacity style={styles.radioRow} onPress={() => updateProfile({ visibilityMode: 'standard' })}>
                        <View style={styles.flex1}>
                            <Text style={styles.settingLabel}>Standard</Text>
                            <Text style={styles.subLabel}>You will be discoverable in the card stack</Text>
                        </View>
                        {profile?.visibilityMode === 'standard' && <Ionicons name="checkmark" size={24} color={COLORS.primary} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.radioRow} onPress={() => openUpgrade('plus')}>
                        <View style={styles.flex1}>
                            <View style={styles.row}>
                                <Text style={styles.settingLabel}>Incognito</Text>
                                <View style={styles.miniPlusBadge}><Text style={styles.miniPlusText}>PLUS</Text></View>
                            </View>
                            <Text style={styles.subLabel}>You will be discoverable only by people you Like</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.mt20}>
                    {renderToggleRow("Enable Discovery", profile?.discoveryEnabled !== false, (val) => updateProfile({ discoveryEnabled: val }), "When turned off, your profile will be hidden from the card stack.")}
                </View>

                {renderSectionLabel("Control Who Messages You")}
                <View style={styles.groupedCard}>
                    {renderToggleRow("My Move", profile?.myMoveEnabled, (val) => updateProfile({ myMoveEnabled: val }), "Message your matches first to initiate conversation.")}
                    <View style={styles.divider} />
                    <View style={styles.p15}>
                        <View style={styles.verifiedLabelRow}>
                            <View style={styles.verifiedBadge}><Text style={styles.verifiedBadgeText}>PHOTO VERIFIED ONLY</Text></View>
                        </View>
                        {renderToggleRow("Photo Verified Chat", profile?.photoVerifiedChatOnly, (val) => updateProfile({ photoVerifiedChatOnly: val }), "Only receive messages from other Photo Verified profiles.")}
                    </View>
                </View>

                <TouchableOpacity style={styles.fullWidthCard} onPress={() => { }}>
                    <Text style={styles.settingLabel}>Block Contacts</Text>
                </TouchableOpacity>

                {renderSectionLabel("App Settings")}
                <View style={styles.groupedCard}>
                    {renderSettingRow("Appearance", "System", () => { })}
                    {renderSettingRow("Autoplay Videos", "On Wi-Fi Only", () => { })}
                    {renderSettingRow("Username", profile?.username ? `@${profile.username}` : "Claim Yours", () => setUsernameVisible(true), true)}
                </View>

                {renderSectionLabel("Contact Us")}
                <View style={styles.groupedCard}>
                    {renderSettingRow("Help & Support", "", () => navigation.navigate('SupportTickets'))}
                    {renderSettingRow("Report a problem", "", () => navigation.navigate('SupportTickets'))}
                </View>

                {renderSectionLabel("Community")}
                <View style={styles.groupedCard}>
                    {renderSettingRow("Community Guidelines", "", () => navigation.navigate('StaticContent', { type: 'community_guidelines' }))}
                    {renderSettingRow("Safety Tips", "", () => navigation.navigate('StaticContent', { type: 'safety_tips' }))}
                    {renderSettingRow("Safety Center", "", () => navigation.navigate('StaticContent', { type: 'safety_center' }))}
                </View>

                <View style={[styles.groupedCard, { marginTop: 25 }]}>
                    {renderSettingRow("Share Spark", "", () => { }, true)}
                </View>

                {renderSectionLabel("Privacy")}
                <View style={styles.groupedCard}>
                    {renderSettingRow("Cookie Policy", "", () => navigation.navigate('StaticContent', { type: 'cookie_policy' }))}
                    {renderSettingRow("Privacy Policy", "", () => navigation.navigate('StaticContent', { type: 'privacy_policy' }))}
                    {renderSettingRow("Privacy Preferences", "", () => navigation.navigate('StaticContent', { type: 'privacy_preferences' }))}
                    {renderSettingRow("From Match Group", "", () => { }, true)}
                </View>

                {renderSectionLabel("Legal")}
                <View style={styles.groupedCard}>
                    {renderSettingRow("Licenses", "", () => navigation.navigate('StaticContent', { type: 'licenses' }))}
                    {renderSettingRow("Terms of Service", "", () => navigation.navigate('StaticContent', { type: 'terms_of_service' }))}
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Ionicons name="flame" size={32} color="#222" />
                    <Text style={styles.versionText}>Version {Constants.expoConfig?.version || '1.0.0'}</Text>
                </View>

                {/* Delete Account Button Removed */}

                <View style={{ height: 50 }} />
            </ScrollView>

            <UpgradeModal
                visible={upgradeVisible}
                onClose={() => setUpgradeVisible(false)}
                tier={upgradeTier}
            />

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

            {/* DeleteAccountModal Removed */}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 60,
        backgroundColor: '#1a1a1a',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 50,
    },
    section: {
        padding: 15,
    },
    sectionLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 25,
        marginBottom: 10,
        marginHorizontal: 15,
        textTransform: 'uppercase',
    },
    upgradeCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    upgradeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    upgradeLogo: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    tierBadge: {
        marginLeft: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tierBadgeText: {
        color: 'black',
        fontSize: 10,
        fontWeight: 'bold',
    },
    upgradeTagline: {
        color: '#888',
        fontSize: 13,
    },
    quickActionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        justifyContent: 'space-between',
    },
    quickActionCard: {
        width: (width - 40) / 2,
        backgroundColor: '#1a1a1a',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        marginBottom: 10,
    },
    quickActionLabel: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 10,
    },
    groupedCard: {
        backgroundColor: '#121212',
        borderRadius: 10,
        marginHorizontal: 15,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    settingLabel: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        color: '#666',
        fontSize: 15,
        marginRight: 10,
    },
    settingHelper: {
        paddingHorizontal: 25,
        paddingVertical: 12,
        color: '#555',
        fontSize: 12,
        lineHeight: 18,
    },
    p15: {
        padding: 15,
    },
    innerLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    locationText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 10,
    },
    addLocationBtn: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    addLocationText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    valueText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sliderPlaceholder: {
        height: 40,
        backgroundColor: '#222',
        borderRadius: 20,
        marginVertical: 15,
        opacity: 0.3,
    },
    upsellBanner: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        marginHorizontal: 15,
        marginTop: 20,
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D4AF37',
    },
    upsellContent: {
        flex: 1,
        marginRight: 15,
    },
    upsellTitle: {
        color: '#D4AF37',
        fontSize: 16,
        fontWeight: 'bold',
    },
    upsellBody: {
        color: '#888',
        fontSize: 12,
        marginTop: 5,
    },
    unlockBtn: {
        backgroundColor: '#D4AF37',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    unlockBtnText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 12,
    },
    sliderSubLabel: {
        color: '#888',
        fontSize: 12,
        marginLeft: 15,
        marginBottom: 5,
    },
    mt10: {
        marginTop: 10,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    attributeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    attributeLabel: {
        color: 'white',
        fontSize: 15,
        marginLeft: 15,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subLabel: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    flex1: {
        flex: 1,
    },
    premiumHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 15,
        marginTop: 10,
        marginBottom: 10,
    },
    premiumHeaderText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    plusBadge: {
        backgroundColor: '#ff006e',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    plusBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    miniPlusBadge: {
        backgroundColor: '#ff006e',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 2,
        marginLeft: 8,
    },
    miniPlusText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    },
    mt20: {
        marginTop: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#222',
    },
    verifiedLabelRow: {
        marginBottom: 10,
    },
    verifiedBadge: {
        backgroundColor: '#00d2ff',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    verifiedBadgeText: {
        color: 'black',
        fontSize: 9,
        fontWeight: 'bold',
    },
    fullWidthCard: {
        backgroundColor: '#1a1a1a',
        padding: 15,
        marginHorizontal: 15,
        marginTop: 20,
        borderRadius: 12,
    },
    logoutBtn: {
        backgroundColor: '#1a1a1a',
        padding: 15,
        marginHorizontal: 15,
        marginTop: 40,
        borderRadius: 12,
        alignItems: 'center',
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    versionText: {
        color: '#444',
        fontSize: 12,
        marginTop: 10,
    },
    deleteBtn: {
        alignItems: 'center',
        padding: 15,
        marginBottom: 40,
    },
    deleteText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 14,
    }
});

export default SettingsScreen;

