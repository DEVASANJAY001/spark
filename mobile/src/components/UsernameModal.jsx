import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import { userService } from '../services/userService';

const UsernameModal = ({ visible, onClose, uid, currentUsername }) => {
    const [username, setUsername] = useState(currentUsername || '');
    const [isAvailable, setIsAvailable] = useState(null);
    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (visible) {
            setUsername(currentUsername || '');
            setIsAvailable(null);
            setSuccess(false);
        }
    }, [visible, currentUsername]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (username && username.length >= 3 && username !== currentUsername) {
                setChecking(true);
                const available = await userService.checkUsernameAvailability(username);
                setIsAvailable(available);
                setChecking(false);
            } else {
                setIsAvailable(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username, currentUsername]);

    const handleSave = async () => {
        if (!isAvailable && username !== currentUsername) return;

        setSaving(true);
        try {
            await userService.setUsername(uid, username);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to set username");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
            >
                <View style={styles.content}>
                    {success ? (
                        <View style={styles.successContainer}>
                            <View style={styles.successBadge}>
                                <Ionicons name="checkmark-circle" size={80} color="#00e882" />
                            </View>
                            <Text style={styles.successTitle}>Username Secured!</Text>
                            <Text style={styles.successSubtitle}>
                                You are now known as <Text style={styles.successHighlight}>@{username}</Text>
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.header}>
                                <Text style={styles.title}>Set Username</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Choose a unique username</Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.prefix}>@</Text>
                                <TextInput
                                    style={styles.input}
                                    value={username}
                                    onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    placeholder="username"
                                    placeholderTextColor="#666"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    maxLength={20}
                                />
                                {checking && <ActivityIndicator size="small" color={COLORS.primary} />}
                                {!checking && isAvailable === true && <Ionicons name="checkmark-circle" size={20} color="#4cd964" />}
                                {!checking && isAvailable === false && username.length >= 3 && <Ionicons name="close-circle" size={20} color="#ff3b30" />}
                            </View>

                            {username.length > 0 && username.length < 3 && (
                                <Text style={styles.errorText}>Username must be at least 3 characters</Text>
                            )}
                            {isAvailable === false && username.length >= 3 && (
                                <Text style={styles.errorText}>Username is already taken</Text>
                            )}

                            <TouchableOpacity
                                style={[styles.saveBtn, (!isAvailable && username !== currentUsername) && styles.disabledBtn]}
                                onPress={handleSave}
                                disabled={saving || (!isAvailable && username !== currentUsername)}
                            >
                                {saving ? (
                                    <ActivityIndicator color="black" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save Username</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    label: {
        color: '#888',
        fontSize: 14,
        marginBottom: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 50,
    },
    prefix: {
        color: '#888',
        fontSize: 18,
        marginRight: 2,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 18,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 25,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
    },
    disabledBtn: {
        opacity: 0.5,
    },
    saveBtnText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 5,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    successBadge: {
        marginBottom: 20,
    },
    successTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 10,
    },
    successSubtitle: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
    },
    successHighlight: {
        color: '#00e882',
        fontWeight: 'bold',
    }
});

export default UsernameModal;
