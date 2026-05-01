import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    Switch,
    Dimensions,
    Image,
    Alert,
    Modal,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useAuth from '../../hooks/useAuth';
import { COLORS, SPACING } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import OptionPickerModal from '../../components/OptionPickerModal';
import SwipeCard from '../../components/SwipeCard';
import HeightPickerModal from '../../components/HeightPickerModal';
import { userService } from '../../services/userService';
import UsernameModal from '../../components/UsernameModal';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();
    const { user, profile, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('Edit'); // Edit | Preview
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Local states
    const [bio, setBio] = useState(profile?.bio || '');
    const [jobTitle, setJobTitle] = useState(profile?.jobTitle || '');
    const [company, setCompany] = useState(profile?.company || '');
    const [smartPhotos, setSmartPhotos] = useState(profile?.smartPhotos || false);

    // Modal States
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ title: '', options: [], field: '', subField: '' });
    const [promptAnswerVisible, setPromptAnswerVisible] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState('');
    const [promptAnswer, setPromptAnswer] = useState('');
    const [answeringType, setAnsweringType] = useState('prompt'); // 'prompt' | 'quiz'
    const [selectedQuizTopic, setSelectedQuizTopic] = useState('');
    const [shHeightVisible, setShHeightVisible] = useState(false);
    const [usernameVisible, setUsernameVisible] = useState(false);
    const [photoActionVisible, setPhotoActionVisible] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

    const openPicker = (title, options, field, subField = null) => {
        setPickerConfig({ title, options, field, subField });
        setPickerVisible(true);
    };

    const handleOptionSelect = async (value) => {
        setPickerVisible(false);
        if (pickerConfig.field === 'prompts_temp') {
            setSelectedPrompt(value);
            setPromptAnswer('');
            setPromptAnswerVisible(true);
            return;
        }

        try {
            const updateData = pickerConfig.subField
                ? { [pickerConfig.field]: { ...profile[pickerConfig.field], [pickerConfig.subField]: value } }
                : { [pickerConfig.field]: value };

            await updateProfile(updateData);
        } catch (error) {
            Alert.alert("Error", "Failed to update profile.");
        }
    };

    const handlePromptSave = async () => {
        if (!promptAnswer) return;
        setPromptAnswerVisible(false);

        if (answeringType === 'quiz') {
            const currentQuizzes = profile?.quizzes || [];
            const otherQuizzes = currentQuizzes.filter(q => q.topic !== selectedQuizTopic);
            const newQuiz = { topic: selectedQuizTopic, answer: promptAnswer };
            await updateProfile({ quizzes: [...otherQuizzes, newQuiz] });
        } else {
            const newPrompt = {
                id: Date.now().toString(),
                question: selectedPrompt,
                answer: promptAnswer
            };
            const currentPrompts = profile?.prompts || [];
            await updateProfile({ prompts: [...currentPrompts, newPrompt] });
        }
    };

    const pickImage = async (index) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need access to your photos.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 5],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets[0] && user) {
                const localUri = result.assets[0].uri;
                const downloadUrl = await userService.uploadPhoto(user.uid, localUri, index);

                if (downloadUrl) {
                    const newPhotos = [...(profile?.photos || [])];
                    while (newPhotos.length <= index) newPhotos.push(null);
                    newPhotos[index] = downloadUrl;
                    await updateProfile({ photos: newPhotos });
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload photo.');
        }
    };

    const handlePhotoPress = (index) => {
        setSelectedPhotoIndex(index);
        if (profile?.photos?.[index]) {
            setPhotoActionVisible(true);
        } else {
            pickImage(index);
        }
    };

    const handleRemovePhoto = async () => {
        if (selectedPhotoIndex === null) return;
        setPhotoActionVisible(false);
        if (!user) return;
        try {
            await userService.removePhoto(user.uid, selectedPhotoIndex);
        } catch (error) {
            Alert.alert("Error", "Failed to remove photo.");
        }
    };

    const handleChangePhoto = () => {
        if (selectedPhotoIndex === null) return;
        setPhotoActionVisible(false);
        pickImage(selectedPhotoIndex);
    };

    const handleHeightSelect = async (val) => {
        setShHeightVisible(false);
        await updateProfile({ height: val });
    };

    // Debounced saves
    useEffect(() => {
        if (!user || bio === (profile?.bio || '')) return;
        const timer = setTimeout(() => {
            userService.updateProfileField(user.uid, 'bio', bio);
        }, 1500);
        return () => clearTimeout(timer);
    }, [bio]);

    useEffect(() => {
        if (!user || jobTitle === (profile?.jobTitle || '')) return;
        const timer = setTimeout(() => {
            userService.updateProfileField(user.uid, 'jobTitle', jobTitle);
        }, 1500);
        return () => clearTimeout(timer);
    }, [jobTitle]);

    useEffect(() => {
        if (!user || company === (profile?.company || '')) return;
        const timer = setTimeout(() => {
            userService.updateProfileField(user.uid, 'company', company);
        }, 1500);
        return () => clearTimeout(timer);
    }, [company]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Premium Tab Bar */}
            <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Edit' && styles.activeTab]}
                    onPress={() => setActiveTab('Edit')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'Edit' ? colors.text : colors.textSecondary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Preview' && styles.activeTab]}
                    onPress={() => setActiveTab('Preview')}
                >
                    <View style={styles.tabItemRow}>
                        <Text style={[styles.tabText, { color: activeTab === 'Preview' ? colors.text : colors.textSecondary }]}>Preview</Text>
                        {hasUnsavedChanges && <View style={styles.unsavedDot} />}
                    </View>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {activeTab === 'Edit' ? (
                        <View style={styles.editTabContent}>
                            {/* Media Section */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionTitleRow}>
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Media</Text>
                                        <View style={styles.boostBadge}>
                                            <Text style={styles.boostText}>+28% Strength</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Add up to 9 photos to stand out.</Text>
                                </View>

                                <View style={styles.photoGrid}>
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.photoSlot, { backgroundColor: colors.surface }]}
                                            onPress={() => handlePhotoPress(index)}
                                        >
                                            {profile?.photos?.[index] ? (
                                                <Image source={{ uri: profile.photos[index] }} style={styles.photoImage} />
                                            ) : (
                                                <View style={styles.addPlaceholder}>
                                                    <Ionicons name="add" size={32} color={colors.textSecondary} />
                                                </View>
                                            )}
                                            <View style={[styles.editIconWrap, { backgroundColor: profile?.photos?.[index] ? COLORS.primary : colors.surface, borderColor: colors.background }]}>
                                                <Ionicons
                                                    name={profile?.photos?.[index] ? "pencil" : "add"}
                                                    size={12}
                                                    color="white"
                                                />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity style={[styles.toggleCard, { backgroundColor: colors.surface }]}>
                                    <View style={styles.toggleInfo}>
                                        <Text style={[styles.toggleTitle, { color: colors.text }]}>Smart Photos</Text>
                                        <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>Automatically find your best performing photo.</Text>
                                    </View>
                                    <Switch
                                        value={smartPhotos}
                                        onValueChange={async (val) => {
                                            setSmartPhotos(val);
                                            await updateProfile({ smartPhotos: val });
                                        }}
                                        trackColor={{ false: '#333', true: COLORS.primary }}
                                        thumbColor="white"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* About Me Section */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>About Me</Text>
                                <View style={[styles.bioContainer, { backgroundColor: colors.surface }]}>
                                    <TextInput
                                        style={[styles.bioInput, { color: colors.text }]}
                                        multiline
                                        placeholder="Write something unique about yourself..."
                                        placeholderTextColor={colors.textSecondary}
                                        value={bio || ''}
                                        onChangeText={(text) => {
                                            setBio(text);
                                            setHasUnsavedChanges(true);
                                        }}
                                        maxLength={500}
                                    />
                                    <Text style={styles.charCount}>{500 - (bio?.length || 0)}</Text>
                                </View>
                            </View>

                            {/* Prompts Section */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Prompts</Text>
                                <View style={styles.promptsList}>
                                    {profile?.prompts?.map((item, index) => (
                                        <View key={index} style={[styles.promptCard, { backgroundColor: colors.surface }]}>
                                            <View style={styles.promptHeader}>
                                                <Ionicons name="chatbubbles-sharp" size={20} color={COLORS.primary} />
                                                <TouchableOpacity onPress={async () => {
                                                    const newPrompts = profile.prompts.filter((_, i) => i !== index);
                                                    await updateProfile({ prompts: newPrompts });
                                                }}>
                                                    <Ionicons name="close-circle-sharp" size={24} color={colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                            <Text style={[styles.promptQuestion, { color: colors.textSecondary }]}>{item.question}</Text>
                                            <Text style={[styles.promptAnswer, { color: colors.text }]}>{item.answer}</Text>
                                        </View>
                                    ))}

                                    {(profile?.prompts?.length || 0) < 3 && (
                                        <TouchableOpacity
                                            style={[styles.addPromptCard, { borderColor: colors.border }]}
                                            onPress={() => openPicker('Select a Prompt', ['If I could travel anywhere...', 'My ideal first date...', 'A secret talent of mine...'], 'prompts_temp')}
                                        >
                                            <View style={styles.addPromptInfo}>
                                                <Text style={[styles.addPromptTitle, { color: colors.text }]}>Add a Prompt</Text>
                                                <Text style={[styles.addPromptSubtitle, { color: colors.textSecondary }]}>Show more of your personality</Text>
                                            </View>
                                            <View style={[styles.addCircle, { backgroundColor: COLORS.primary }]}>
                                                <Ionicons name="add" size={24} color="white" />
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Profile Details List */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Details</Text>
                                <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
                                    <DetailItem 
                                        label="Relationship Goals" 
                                        value={profile?.lookingFor} 
                                        onPress={() => openPicker('Relationship Goals', ['Short-term', 'Long-term', 'Open to anything', 'Still figuring it out'], 'lookingFor')}
                                        colors={colors}
                                    />
                                    <DetailItem 
                                        label="Pronouns" 
                                        value={profile?.pronouns} 
                                        onPress={() => openPicker('Pronouns', ['He/Him', 'She/Her', 'They/Them', 'Ask me'], 'pronouns')}
                                        colors={colors}
                                    />
                                    <DetailItem 
                                        label="Height" 
                                        value={profile?.height ? `${profile.height} cm` : null} 
                                        onPress={() => setShHeightVisible(true)}
                                        colors={colors}
                                    />
                                    <DetailItem 
                                        label="Username" 
                                        value={profile?.username ? `@${profile.username}` : null} 
                                        onPress={() => setUsernameVisible(true)}
                                        colors={colors}
                                        isLast
                                    />
                                </View>
                            </View>

                            {/* Job & Company */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Work</Text>
                                <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
                                    <View style={styles.inputRow}>
                                        <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} />
                                        <TextInput
                                            style={[styles.premiumInput, { color: colors.text }]}
                                            placeholder="Add Job Title"
                                            placeholderTextColor={colors.textSecondary}
                                            value={jobTitle || ''}
                                            onChangeText={(text) => {
                                                setJobTitle(text);
                                                setHasUnsavedChanges(true);
                                            }}
                                        />
                                    </View>
                                    <View style={[styles.divider, { backgroundColor: colors.background }]} />
                                    <View style={styles.inputRow}>
                                        <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
                                        <TextInput
                                            style={[styles.premiumInput, { color: colors.text }]}
                                            placeholder="Add Company"
                                            placeholderTextColor={colors.textSecondary}
                                            value={company || ''}
                                            onChangeText={(text) => {
                                                setCompany(text);
                                                setHasUnsavedChanges(true);
                                            }}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.previewTabContent}>
                            <View style={styles.previewCardContainer}>
                                <View style={[styles.cardShadow, { shadowColor: colors.text }]}>
                                    <SwipeCard profile={profile} />
                                </View>
                            </View>
                            
                            <View style={styles.previewBioSection}>
                                <Text style={[styles.previewSectionHeader, { color: COLORS.primary }]}>BIOGRAPHY</Text>
                                <Text style={[styles.previewBioText, { color: colors.text }]}>
                                    {profile?.bio || 'Introduce yourself to your future matches!'}
                                </Text>
                            </View>

                            {profile?.prompts?.length > 0 && (
                                <View style={styles.previewPrompts}>
                                    {profile.prompts.map((p, i) => (
                                        <View key={i} style={[styles.previewPromptItem, { backgroundColor: colors.surface }]}>
                                            <Text style={[styles.previewPromptQ, { color: colors.textSecondary }]}>{p.question}</Text>
                                            <Text style={[styles.previewPromptA, { color: colors.text }]}>{p.answer}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={styles.previewFooter}>
                                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                                <Text style={[styles.previewFooterText, { color: colors.textSecondary }]}>
                                    This is exactly how your profile appears in the discovery feed.
                                </Text>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modals */}
            <OptionPickerModal
                visible={pickerVisible}
                title={pickerConfig.title}
                options={pickerConfig.options}
                selectedValue={pickerConfig.subField ? profile?.[pickerConfig.field]?.[pickerConfig.subField] : profile?.[pickerConfig.field]}
                onSelect={handleOptionSelect}
                onClose={() => setPickerVisible(false)}
            />

            <HeightPickerModal
                visible={shHeightVisible}
                selectedValue={profile?.height}
                onSelect={handleHeightSelect}
                onClose={() => setShHeightVisible(false)}
            />

            <UsernameModal
                visible={usernameVisible}
                onClose={() => setUsernameVisible(false)}
                uid={user?.uid}
                currentUsername={profile?.username}
            />

            {/* Prompt Answer Modal */}
            <Modal visible={promptAnswerVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPromptAnswerVisible(false)} />
                    <View style={[styles.promptModalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                            {answeringType === 'quiz' ? selectedQuizTopic : selectedPrompt}
                        </Text>
                        <TextInput
                            style={[styles.modalPromptInput, { color: colors.text }]}
                            placeholder="Your brilliant answer..."
                            placeholderTextColor={colors.textSecondary}
                            value={promptAnswer}
                            onChangeText={setPromptAnswer}
                            autoFocus
                            multiline
                        />
                        <TouchableOpacity 
                            style={[styles.saveBtn, { backgroundColor: COLORS.primary }]} 
                            onPress={handlePromptSave}
                        >
                            <Text style={styles.saveBtnText}>Save Response</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Photo Actions Modal */}
            <Modal visible={photoActionVisible} transparent animationType="slide">
                <View style={styles.actionSheetOverlay}>
                    <TouchableOpacity style={styles.dismissOverlay} onPress={() => setPhotoActionVisible(false)} />
                    <View style={[styles.actionSheet, { backgroundColor: colors.surface }]}>
                        <View style={[styles.actionHandle, { backgroundColor: colors.background }]} />
                        <Text style={[styles.actionTitle, { color: colors.text }]}>Profile Photo</Text>
                        
                        <TouchableOpacity style={styles.actionItem} onPress={handleChangePhoto}>
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                <Ionicons name="image-outline" size={24} color={COLORS.primary} />
                            </View>
                            <Text style={[styles.actionLabel, { color: colors.text }]}>Change Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionItem} onPress={handleRemovePhoto}>
                            <View style={[styles.actionIcon, { backgroundColor: '#FF3B3020' }]}>
                                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                            </View>
                            <Text style={[styles.actionLabel, { color: '#FF3B30' }]}>Remove Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionItem, { borderBottomWidth: 0 }]} onPress={() => setPhotoActionVisible(false)}>
                            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const DetailItem = ({ label, value, onPress, colors, isLast }) => (
    <TouchableOpacity 
        style={[styles.detailItem, !isLast && { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }]} 
        onPress={onPress}
    >
        <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>{label}</Text>
        <View style={styles.detailValueRow}>
            <Text style={[styles.detailValueText, { color: value ? colors.text : colors.textSecondary }]}>
                {value || 'Add'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 6,
        marginBottom: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 15,
    },
    activeTab: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '800',
    },
    tabItemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    unsavedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
    scrollContent: { paddingBottom: 60 },
    editTabContent: { paddingHorizontal: 20 },
    section: { marginTop: 25 },
    sectionHeader: { marginBottom: 15 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 },
    sectionTitle: { fontSize: 18, fontWeight: '900' },
    boostBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    boostText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
    sectionSubtitle: { fontSize: 13, fontWeight: '500' },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    photoSlot: {
        width: (width - 40 - 24) / 3,
        aspectRatio: 0.8,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoImage: { width: '100%', height: '100%' },
    addPlaceholder: { opacity: 0.5 },
    editIconWrap: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    toggleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 24,
    },
    toggleInfo: { flex: 1, marginRight: 15 },
    toggleTitle: { fontSize: 16, fontWeight: '800' },
    toggleDesc: { fontSize: 12, fontWeight: '500', marginTop: 4 },
    bioContainer: { borderRadius: 24, padding: 18, minHeight: 140 },
    bioInput: { flex: 1, fontSize: 16, fontWeight: '500', textAlignVertical: 'top' },
    charCount: { textAlign: 'right', fontSize: 12, color: '#666', marginTop: 5, fontWeight: '700' },
    promptsList: { gap: 12 },
    promptCard: { borderRadius: 24, padding: 20 },
    promptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    promptQuestion: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
    promptAnswer: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
    addPromptCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    addPromptInfo: { flex: 1 },
    addPromptTitle: { fontSize: 16, fontWeight: '800' },
    addPromptSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 4 },
    addCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    detailsCard: { borderRadius: 24, paddingHorizontal: 15, paddingVertical: 5 },
    detailItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 },
    detailLabelText: { fontSize: 15, fontWeight: '700' },
    detailValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailValueText: { fontSize: 15, fontWeight: '600' },
    inputGroup: { borderRadius: 24, padding: 10 },
    inputRow: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 12 },
    premiumInput: { flex: 1, fontSize: 16, fontWeight: '700' },
    divider: { height: 1 },
    previewTabContent: { paddingTop: 10 },
    previewCardContainer: { paddingHorizontal: 20, alignItems: 'center' },
    cardShadow: {
        width: '100%',
        height: Dimensions.get('window').height * 0.65,
        borderRadius: 30,
        backgroundColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 15,
    },
    previewBioSection: { padding: 30 },
    previewSectionHeader: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 15 },
    previewBioText: { fontSize: 17, lineHeight: 26, fontWeight: '500' },
    previewPrompts: { paddingHorizontal: 20, gap: 15 },
    previewPromptItem: { padding: 25, borderRadius: 30 },
    previewPromptQ: { fontSize: 13, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    previewPromptA: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    previewFooter: { padding: 40, alignItems: 'center', gap: 10 },
    previewFooterText: { fontSize: 13, textAlign: 'center', fontWeight: '500', opacity: 0.8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    promptModalContent: { borderRadius: 30, padding: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalLabel: { fontSize: 14, fontWeight: '800', marginBottom: 15, textTransform: 'uppercase' },
    modalPromptInput: { fontSize: 24, fontWeight: '900', minHeight: 120, textAlignVertical: 'top' },
    saveBtn: { paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 25 },
    saveBtnText: { color: 'white', fontSize: 17, fontWeight: '900' },
    actionSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    dismissOverlay: { flex: 1 },
    actionSheet: { borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingBottom: 40, paddingHorizontal: 25 },
    actionHandle: { width: 50, height: 5, borderRadius: 3, alignSelf: 'center', marginVertical: 15 },
    actionTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 25 },
    actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    actionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    actionLabel: { fontSize: 17, fontWeight: '700' },
    cancelText: { width: '100%', textAlign: 'center', fontSize: 17, fontWeight: '800', marginTop: 10 }
});

export default EditProfileScreen;
