import React from 'react';
import { StyleSheet, View, Text, Modal, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const MatchCelebrationModal = ({ visible, onClose, matchedUser, currentUser, onSendMessage }) => {
    if (!matchedUser) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
        >
            <View style={styles.container}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,1)']}
                    style={styles.background}
                />

                <View style={styles.content}>
                    <Text style={styles.matchTitle}>IT'S A SPARK!</Text>
                    <Text style={styles.matchSubtitle}>
                        You and {matchedUser?.firstName} have Sparked each other.
                    </Text>

                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: currentUser?.photos?.[0] || 'https://via.placeholder.com/150' }}
                            style={[styles.avatar, styles.avatarLeft]}
                        />
                        <Image
                            source={{ uri: matchedUser.photos?.[0] || 'https://via.placeholder.com/150' }}
                            style={[styles.avatar, styles.avatarRight]}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.messageBtn}
                        onPress={() => onSendMessage(matchedUser)}
                    >
                        <LinearGradient
                            colors={['#fd267d', '#ff7854']}
                            style={styles.gradientBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.messageBtnText}>SEND A MESSAGE</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.keepSwipingBtn}
                        onPress={onClose}
                    >
                        <Text style={styles.keepSwipingText}>KEEP SWIPING</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        alignItems: 'center',
        width: '90%',
    },
    matchTitle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ff4458', // Pink Tinder Match color
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    matchSubtitle: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
    },
    avatarContainer: {
        flexDirection: 'row',
        width: 250,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'white',
    },
    avatarLeft: {
        marginRight: -20,
        zIndex: 1,
    },
    avatarRight: {
        marginLeft: -20,
    },
    messageBtn: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        marginBottom: 15,
    },
    gradientBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    keepSwipingBtn: {
        paddingVertical: 15,
    },
    keepSwipingText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});

export default MatchCelebrationModal;
