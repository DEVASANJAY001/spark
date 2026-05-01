import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - SPACING.l * 2 - 20) / 3;

const PhotoUploadScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [images, setImages] = useState([null, null, null, null, null, null]);
    const [uploadingIndices, setUploadingIndices] = useState(new Set());

    useEffect(() => {
        if (profile?.photos) {
            const newImages = [...images];
            profile.photos.forEach((url, index) => {
                if (index < 6) newImages[index] = url;
            });
            setImages(newImages);
        }
    }, [profile]);

    const pickImage = async (index) => {
        if (!user) return;
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 5],
            quality: 0.8,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setUploadingIndices(prev => new Set(prev).add(index));
            try {
                const downloadURL = await userService.uploadPhoto(user.uid, uri, index);
                const newImages = [...images];
                newImages[index] = downloadURL;
                setImages(newImages);
                const photos = newImages.filter(img => img !== null);
                await userService.saveProfile(user.uid, { photos });
            } catch (error) {
                Alert.alert('Upload Error', 'Failed to upload photo.');
            } finally {
                setUploadingIndices(prev => {
                    const next = new Set(prev);
                    next.delete(index);
                    return next;
                });
            }
        }
    };

    const removeImage = async (index) => {
        if (!user) return;
        const newImages = [...images];
        newImages[index] = null;
        setImages(newImages);
        const photos = newImages.filter(img => img !== null);
        await userService.saveProfile(user.uid, { photos });
    };

    const imageCount = images.filter(img => img !== null).length;
    const isUploading = uploadingIndices.size > 0;

    return (
        <OnboardingBase
            title="Upload Photos"
            subtitle="Add at least 2 photos to continue. Your first photo is your main one."
            onNext={() => navigation.navigate('FirstName')}
            onBack={() => navigation.goBack()}
            loading={isUploading}
            disabled={imageCount < 2}
            progress={0.1}
        >
            <View style={styles.grid}>
                {images.map((image, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.imageBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                        onPress={() => !image && !uploadingIndices.has(index) && pickImage(index)}
                        disabled={uploadingIndices.has(index)}
                    >
                        {image ? (
                            <>
                                <Image source={{ uri: image }} style={styles.image} />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeImage(index)}
                                    disabled={isUploading}
                                >
                                    <Ionicons name="close" size={16} color="white" />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={[styles.addButton, { backgroundColor: COLORS.primary }]}>
                                {uploadingIndices.has(index) ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Ionicons name="add" size={24} color="white" />
                                )}
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </OnboardingBase>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
    },
    imageBox: {
        width: GRID_SIZE,
        height: GRID_SIZE * 1.3,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 10,
        right: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    removeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    }
});

export default PhotoUploadScreen;