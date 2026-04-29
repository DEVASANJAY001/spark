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
import UpgradeModal from '../../components/UpgradeModal';
import UsernameModal from '../../components/UsernameModal';

const { width } = Dimensions.get('window');

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { user, profile, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('Edit'); // Edit | Preview
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [upgradeVisible, setUpgradeVisible] = useState(false);
    const [upgradeTier, setUpgradeTier] = useState('plus');

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

    const handleBack = () => {
        navigation.goBack();
    };

    // Sync local states when profile loads (only if not currently typing)
    useEffect(() => {
        if (profile) {
            setBio(prev => prev || profile.bio || '');
            setJobTitle(prev => prev || profile.jobTitle || '');
            setCompany(prev => prev || profile.company || '');
            if (profile.smartPhotos !== undefined) setSmartPhotos(profile.smartPhotos);
        }
    }, [profile]);

    // Debounced saves using the new updateProfileField
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
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit profile</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Edit' && styles.activeTab]}
                    onPress={() => setActiveTab('Edit')}
                >
                    <Text style={[styles.tabText, activeTab === 'Edit' && styles.activeTabText]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Preview' && styles.activeTab]}
                    onPress={() => setActiveTab('Preview')}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.tabText, activeTab === 'Preview' && styles.activeTabText]}>Preview</Text>
                        {hasUnsavedChanges && <View style={styles.redDot} />}
                    </View>
                </TouchableOpacity>
            </View>



            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}>
                {activeTab === 'Edit' ? (
                    <>
                        {/* Section 1: Media */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.sectionLabel}>Media</Text>
                                    <View style={styles.pinkDot} />
                                    <View style={styles.addNowBadge}>
                                        <Text style={styles.addNowText}>ADD NOW</Text>
                                    </View>
                                </View>
                                <Text style={styles.boostLabel}>+28%</Text>
                            </View>
                            <Text style={styles.helperText}>Add up to 9 photos. Use prompts to share your personality.</Text>
                            <TouchableOpacity>
                                <Text style={styles.tipsLink}>Stand out with our photo tips</Text>
                            </TouchableOpacity>

                            <View style={styles.photoGrid}>
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.photoSlot}
                                        onPress={() => handlePhotoPress(index)}
                                    >
                                        {profile?.photos?.[index] ? (
                                            <Image source={{ uri: profile.photos[index] }} style={styles.photoImage} />
                                        ) : (
                                            <Ionicons name="add" size={30} color={COLORS.lightGrey} />
                                        )}
                                        <View style={styles.editIconContainer}>
                                            <Ionicons
                                                name={profile?.photos?.[index] ? "pencil" : "add"}
                                                size={12}
                                                color="white"
                                            />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.photoOptions}>
                                <Text style={styles.subLabel}>Photo Options</Text>
                                <View style={styles.toggleRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.toggleTitle}>Smart Photos</Text>
                                        <Text style={styles.toggleDesc}>Smart Photos continuously tests all your profile photos to find the best one.</Text>
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
                                </View>
                            </View>
                        </View>

                        {/* Section 2: About Me */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>About Me</Text>
                            <View style={styles.bioCard}>
                                <TextInput
                                    style={styles.bioInput}
                                    multiline
                                    placeholder="Write something about yourself..."
                                    placeholderTextColor="#666"
                                    value={bio || ''}
                                    onChangeText={(text) => {
                                        setBio(text);
                                        setHasUnsavedChanges(true);
                                    }}
                                    maxLength={500}
                                />
                                <Text style={styles.charCounter}>{500 - (bio?.length || 0)}</Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.tipsLink}>Quick 'About Me' tips</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Section 3: Prompts */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Prompts</Text>
                            <View style={styles.promptsContainer}>
                                {profile?.prompts?.map((item, index) => (
                                    <View key={index} style={styles.promptCard}>
                                        <View style={styles.promptHeader}>
                                            <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
                                            <TouchableOpacity onPress={async () => {
                                                const newPrompts = profile.prompts.filter((_, i) => i !== index);
                                                await updateProfile({ prompts: newPrompts });
                                            }}>
                                                <Ionicons name="close-circle" size={24} color="#444" />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.promptQuestion}>{item.question}</Text>
                                        <Text style={styles.promptAnswer}>{item.answer}</Text>
                                    </View>
                                ))}

                                {(profile?.prompts?.length || 0) < 3 && (
                                    <TouchableOpacity
                                        style={styles.addPromptCard}
                                        onPress={() => openPicker('Select a Prompt', ['If I could travel anywhere...', 'My ideal first date...', 'A secret talent of mine...'], 'prompts_temp')}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.addPromptLabel}>Select a prompt</Text>
                                            <Text style={styles.addPromptSubtitle}>Answer prompt</Text>
                                        </View>
                                        <View style={styles.addPromptIcon}>
                                            <Ionicons name="add" size={24} color="white" />
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Section 4: Interests */}
                        <TouchableOpacity style={styles.rowSection}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sectionLabel}>Interests</Text>
                                <Text style={styles.rowValue} numberOfLines={1}>
                                    {profile?.interests?.join(', ') || 'Add interests'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#444" />
                        </TouchableOpacity>

                        {/* Section 5: Profile Details */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Profile Details</Text>

                            <TouchableOpacity
                                style={styles.detailRow}
                                onPress={() => openPicker('Relationship Goals', ['Short-term', 'Long-term', 'Open to anything', 'Still figuring it out'], 'lookingFor')}
                            >
                                <Text style={styles.detailLabel}>Relationship Goals</Text>
                                <Text style={styles.detailValue}>{profile?.lookingFor || 'Add'}</Text>
                                <Ionicons name="chevron-forward" size={18} color="#444" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.detailRow}
                                onPress={() => openPicker('Pronouns', ['He/Him', 'She/Her', 'They/Them', 'Ask me'], 'pronouns')}
                            >
                                <Text style={styles.detailLabel}>Pronouns</Text>
                                <Text style={styles.detailValue}>{profile?.pronouns || 'Add'}</Text>
                                <Ionicons name="chevron-forward" size={18} color="#444" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.detailRow}
                                onPress={() => setShHeightVisible(true)}
                            >
                                <Text style={styles.detailLabel}>Height</Text>
                                <Text style={styles.detailValue}>{profile?.height ? `${profile.height} cm` : 'Add'}</Text>
                                <Ionicons name="chevron-forward" size={18} color="#444" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.detailRow}
                                onPress={() => setUsernameVisible(true)}
                            >
                                <Text style={styles.detailLabel}>Username</Text>
                                <Text style={styles.detailValue}>{profile?.username ? `@${profile.username}` : 'Add'}</Text>
                                <Ionicons name="chevron-forward" size={18} color="#444" />
                            </TouchableOpacity>
                        </View>

                        {/* Section 6: Basics */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Basics</Text>
                            <View style={styles.groupedCard}>
                                <TouchableOpacity
                                    style={styles.innerDetailRow}
                                    onPress={() => openPicker('Zodiac', ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'], 'basics', 'zodiac')}
                                >
                                    <Text style={styles.detailLabel}>Zodiac</Text>
                                    <Text style={styles.detailValue}>{profile?.basics?.zodiac || 'Add'}</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#444" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.innerDetailRow}
                                    onPress={() => openPicker('Family Plans', ["Don't want kids", 'Want kids', 'Open to kids', 'Not sure'], 'basics', 'familyPlans')}
                                >
                                    <Text style={styles.detailLabel}>Family Plans</Text>
                                    <Text style={styles.detailValue}>{profile?.basics?.familyPlans || 'Add'}</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#444" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Section 7: Lifestyle */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Lifestyle</Text>
                            <View style={styles.groupedCard}>
                                <TouchableOpacity
                                    style={styles.innerDetailRow}
                                    onPress={() => openPicker('Pets', ['Dog', 'Cat', 'Bird', 'Fish', 'Reptile', 'None'], 'lifestyle', 'pets')}
                                >
                                    <Text style={styles.detailLabel}>Pets</Text>
                                    <Text style={styles.detailValue}>{profile?.lifestyle?.pets || 'Add'}</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#444" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.innerDetailRow}
                                    onPress={() => openPicker('Drinking', ['Socially', 'Often', 'Never', 'Rarely'], 'lifestyle', 'drinking')}
                                >
                                    <Text style={styles.detailLabel}>Drinking</Text>
                                    <Text style={styles.detailValue}>{profile?.lifestyle?.drinking || 'Add'}</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#444" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.innerDetailRow}
                                    onPress={() => openPicker('Smoking', ['Socially', 'Often', 'Never', 'Rarely'], 'lifestyle', 'smoking')}
                                >
                                    <Text style={styles.detailLabel}>Smoking</Text>
                                    <Text style={styles.detailValue}>{profile?.lifestyle?.smoking || 'Add'}</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#444" />
                                </TouchableOpacity>
                            </View>
                        </View>


                        {/* Section 9: Ask Me About */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Ask Me About</Text>
                            {['Going Out', 'My Weekends', 'Me + My Phone'].map((topic, idx) => (
                                <View key={idx} style={styles.quizRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.quizTopic}>{topic}</Text>
                                        <Text style={styles.quizAnswer}>
                                            {profile?.quizzes?.find(q => q.topic === topic)?.answer || 'Add answer'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.addQuizBtn}
                                        onPress={() => {
                                            setSelectedQuizTopic(topic);
                                            setAnsweringType('quiz');
                                            setPromptAnswer(profile?.quizzes?.find(q => q.topic === topic)?.answer || '');
                                            setPromptAnswerVisible(true);
                                        }}
                                    >
                                        <Ionicons name="add" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        {/* Section 10: Job & Company */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.sectionLabel}>Job Title</Text>
                                    <View style={styles.importantBadge}>
                                        <Text style={styles.importantText}>IMPORTANT</Text>
                                    </View>
                                </View>
                                <Text style={styles.boostLabel}>+4%</Text>
                            </View>
                            <TextInput
                                style={styles.darkInput}
                                placeholder="Add Job Title"
                                placeholderTextColor="#444"
                                value={jobTitle || ''}
                                onChangeText={(text) => {
                                    setJobTitle(text);
                                    setHasUnsavedChanges(true);
                                }}
                            />

                            <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
                                <Text style={styles.sectionLabel}>Company</Text>
                                <Text style={styles.boostLabel}>+2%</Text>
                            </View>
                            <TextInput
                                style={styles.darkInput}
                                placeholder="Add Company"
                                placeholderTextColor="#444"
                                value={company || ''}
                                onChangeText={(text) => {
                                    setCompany(text);
                                    setHasUnsavedChanges(true);
                                }}
                            />
                        </View>

                        {/* Section 11: Location */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionLabel}>Living In</Text>
                                <Text style={styles.boostLabel}>+2%</Text>
                            </View>
                            <TextInput
                                style={styles.darkInput}
                                placeholder="Add City"
                                placeholderTextColor="#444"
                                value={profile?.city || ''}
                                onChangeText={(text) => updateProfile({ city: text })}
                            />
                        </View>

                        {/* Section 12: Anthem & Music */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>My Anthem</Text>
                            <TouchableOpacity
                                style={styles.anthemCard}
                                onPress={() => Alert.alert("Spotify", "Connect your Spotify to share your anthem and top artists!")}
                            >
                                <Ionicons name="musical-notes" size={24} color={COLORS.primary} style={{ marginRight: 15 }} />
                                <Text style={styles.anthemText}>{profile?.anthem?.songName || 'Choose an anthem'}</Text>
                            </TouchableOpacity>

                            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>My Top Spotify Artists</Text>
                            <TouchableOpacity onPress={() => Alert.alert("Spotify", "Connect your Spotify to share your top artists!")}>
                                <Text style={styles.tipsLink}>Add Spotify to Your Profile</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Section 13: Visibility Toggles */}
                        <View style={styles.section}>
                            <View style={styles.visibilityRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Gender</Text>
                                    <Text style={styles.detailValueSmall}>{profile?.gender}</Text>
                                </View>
                                <Text style={styles.visibleLabel}>Visible</Text>
                                <Switch value={profile?.showGender} onValueChange={(val) => updateProfile({ showGender: val })} />
                            </View>

                            <View style={[styles.visibilityRow, { borderBottomWidth: 0 }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Sexual Orientation</Text>
                                    <Text style={styles.detailValueSmall}>{profile?.orientation}</Text>
                                </View>
                                <Text style={styles.visibleLabel}>Visible</Text>
                                <Switch value={profile?.showOrientation} onValueChange={(val) => updateProfile({ showOrientation: val })} />
                            </View>
                        </View>

                        {/* Section 14: Control Your Profile (Tinder Plus) */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionLabel}>Control Your Profile</Text>
                                <View style={styles.premiumBadge}>
                                    <Text style={styles.premiumBadgeText}>Spark Plus®</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.toggleRow}
                                onPress={() => {
                                    setUpgradeTier('plus');
                                    setUpgradeVisible(true);
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.toggleTitle}>Don't Show My Age</Text>
                                </View>
                                <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
                                <Switch disabled value={profile?.premiumTier === 'plus' || profile?.hasPremium} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.toggleRow, { marginTop: 10 }]}
                                onPress={() => {
                                    setUpgradeTier('plus');
                                    setUpgradeVisible(true);
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.toggleTitle}>Don't Show My Distance</Text>
                                </View>
                                <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
                                <Switch disabled value={profile?.premiumTier === 'plus' || profile?.hasPremium} />
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={styles.previewContainer}>
                        <SwipeCard profile={profile} />
                        <View style={{ marginTop: 20 }}>
                            <Text style={styles.previewNote}>This is how your profile appears in the discovery stack.</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>

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
                selectedValue={profile?.basics?.height}
                onSelect={handleHeightSelect}
                onClose={() => setShHeightVisible(false)}
            />

            <Modal
                visible={promptAnswerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPromptAnswerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        onPress={() => setPromptAnswerVisible(false)}
                    />
                    <View style={styles.promptAnswerContent}>
                        <Text style={styles.promptTopic}>
                            {answeringType === 'quiz' ? selectedQuizTopic : selectedPrompt}
                        </Text>
                        <TextInput
                            style={styles.promptAnswerInput}
                            placeholder="Type your answer..."
                            placeholderTextColor="#666"
                            value={promptAnswer || ''}
                            onChangeText={setPromptAnswer}
                            autoFocus
                            multiline
                        />
                        <TouchableOpacity style={styles.promptSaveBtn} onPress={handlePromptSave}>
                            <Text style={styles.promptSaveText}>Save Prompt</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <UpgradeModal
                visible={upgradeVisible}
                onClose={() => setUpgradeVisible(false)}
                tier={upgradeTier}
            />

            <UsernameModal
                visible={usernameVisible}
                onClose={() => setUsernameVisible(false)}
                uid={user?.uid}
                currentUsername={profile?.username}
            />

            {/* Photo Action Modal */}
            <Modal
                visible={photoActionVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setPhotoActionVisible(false)}
            >
                <View style={styles.actionSheetOverlay}>
                    <TouchableOpacity
                        style={styles.modalDismissOverlay}
                        activeOpacity={1}
                        onPress={() => setPhotoActionVisible(false)}
                    />
                    <View style={styles.actionSheetContent}>
                        <View style={styles.actionSheetHeader}>
                            <View style={styles.actionSheetHandle} />
                            <Text style={styles.actionSheetTitle}>Manage Photo</Text>
                        </View>

                        <TouchableOpacity style={styles.actionSheetItem} onPress={handleChangePhoto}>
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                <Ionicons name="images" size={24} color={COLORS.primary} />
                            </View>
                            <Text style={styles.actionText}>Change Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionSheetItem} onPress={handleRemovePhoto}>
                            <View style={[styles.actionIcon, { backgroundColor: '#ff3b3020' }]}>
                                <Ionicons name="trash" size={24} color="#ff3b30" />
                            </View>
                            <Text style={[styles.actionText, { color: '#ff3b30' }]}>Remove Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionSheetItem, { marginTop: 10, borderBottomWidth: 0 }]}
                            onPress={() => setPhotoActionVisible(false)}
                        >
                            <Text style={[styles.actionText, { width: '100%', textAlign: 'center', color: '#888' }]}>Cancel</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingVertical: 15,
        backgroundColor: '#000',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 5,
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: 'white',
    },
    tabText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 14,
    },
    activeTabText: {
        color: 'white',
    },
    redDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginLeft: 5,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionLabel: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    pinkDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
        marginHorizontal: 5,
    },
    addNowBadge: {
        backgroundColor: COLORS.primary + '33',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    addNowText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    boostLabel: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    helperText: {
        color: '#888',
        fontSize: 12,
        marginBottom: 8,
    },
    tipsLink: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    photoSlot: {
        width: (width - SPACING.m * 2 - 20) / 3,
        aspectRatio: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        overflow: 'hidden',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    editIconContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    photoOptions: {
        marginTop: 10,
    },
    subLabel: {
        color: '#888',
        fontSize: 14,
        marginBottom: 10,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    toggleTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    toggleDesc: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    bioCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        height: 110,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    bioInput: {
        color: 'white',
        fontSize: 15,
        textAlignVertical: 'top',
        flex: 1,
    },
    charCounter: {
        color: '#666',
        textAlign: 'right',
        fontSize: 12,
        marginTop: 5,
    },
    previewContainer: {
        padding: 40,
        alignItems: 'center',
    },
    previewPlaceholder: {
        color: '#666',
        textAlign: 'center',
    },
    previewNote: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
        fontStyle: 'italic',
    },
    promptsContainer: {
        marginTop: 15,
    },
    promptCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    promptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    promptQuestion: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    promptAnswer: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    addPromptCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    addPromptLabel: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    addPromptSubtitle: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    addPromptIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        backgroundColor: '#000',
    },
    rowValue: {
        color: '#888',
        fontSize: 14,
        marginTop: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    detailLabel: {
        flex: 1,
        color: 'white',
        fontSize: 15,
    },
    detailValue: {
        color: '#888',
        fontSize: 14,
        marginRight: 8,
    },
    groupedCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        marginTop: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    innerDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    quizRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 15,
        borderRadius: 12,
        marginTop: 10,
    },
    quizTopic: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
    },
    quizAnswer: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    addQuizBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    importantBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    importantText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    darkInput: {
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 15,
        color: 'white',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#222',
    },
    anthemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 15,
        borderRadius: 12,
        marginTop: 10,
    },
    anthemText: {
        color: '#666',
        fontSize: 15,
    },
    visibilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    detailValueSmall: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    visibleLabel: {
        color: 'white',
        fontSize: 14,
        marginRight: 10,
    },
    premiumBadge: {
        backgroundColor: '#D4AF3733',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    premiumBadgeText: {
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    promptAnswerContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        borderWidth: 1,
        borderColor: '#333',
    },
    promptTopic: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    promptAnswerInput: {
        color: COLORS.primary,
        fontSize: 22,
        fontWeight: 'bold',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    promptSaveBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    promptSaveText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalDismissOverlay: {
        flex: 1,
    },
    actionSheetContent: {
        backgroundColor: '#1c1c1e',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
    },
    actionSheetHeader: {
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#2c2c2e',
    },
    actionSheetHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#3a3a3c',
        borderRadius: 2.5,
        marginBottom: 10,
    },
    actionSheetTitle: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
    },
    actionSheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2c2c2e',
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    actionText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
});

export default EditProfileScreen;
