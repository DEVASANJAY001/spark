import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ActivityIndicator, Dimensions, Platform, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');

const DeleteAccountModal = ({ visible, onClose, onConfirm }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error('Deletion error:', error);
            if (error.message === 're-authenticate') {
                Alert.alert(
                    "Security Timeout",
                    "For your security, you need to log out and back in before deleting your account.",
                    [{ text: "OK", onPress: onClose }]
                );
            } else {
                Alert.alert("Error", "Failed to delete account. Please try again.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

                <View style={styles.modalContainer}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="trash-outline" size={40} color={COLORS.primary} />
                    </View>

                    <Text style={styles.title}>Delete Account?</Text>

                    <Text style={styles.description}>
                        This is permanent. You will lose all your matches, messages, and photos forever.
                    </Text>

                    <View style={styles.warningBox}>
                        <Ionicons name="warning" size={16} color="#FF9800" />
                        <Text style={styles.warningText}>This action cannot be undone.</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={isDeleting}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Yes, Delete</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
            },
            android: {
                elevation: 20,
            },
            web: {
                boxShadow: '0px 10px 30px rgba(0,0,0,0.5)',
            }
        })
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 68, 88, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 25,
    },
    warningText: {
        color: '#FF9800',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        marginRight: 10,
        backgroundColor: '#333',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        marginLeft: 10,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default DeleteAccountModal;
