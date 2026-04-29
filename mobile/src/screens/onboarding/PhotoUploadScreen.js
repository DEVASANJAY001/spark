import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - SPACING.m * 2 - 20) / 3;

const PhotoUploadScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [images, setImages] = useState([null, null, null, null, null, null]);
    const [uploadingIndices, setUploadingIndices] = useState(new Set());

    useEffect(() => {
        if (profile?.photos) {
            const newImages = [...images];
            profile.photos.forEach((url, index) => {
                newImages[index] = url;
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

                // Update Firestore profile with all photos
                const photos = newImages.filter(img => img !== null);
                await userService.saveProfile(user.uid, { photos });
            } catch (error) {
                console.error(error);
                Alert.alert('Upload Error', 'Failed to upload photo. Please check your Firebase Storage rules and connection.');
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
        <SafeAreaView style={styles.container}>
            <ProgressBar progress={1 / 13} />

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Add your best photos</Text>
                <Text style={styles.subtitle}>Add at least 2 photos to continue.</Text>

                <View style={styles.grid}>
                    {images.map((image, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.imageBox}
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
                                <View style={styles.addButton}>
                                    {uploadingIndices.has(index) ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Ionicons name="add" size={30} color="white" />
                                    )}
                                </View>
                            )}
                            {uploadingIndices.has(index) && image && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator color="white" size="small" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <TouchableOpacity
                style={[styles.nextButton, (isUploading || imageCount < 2) && styles.nextButtonDisabled]}
                disabled={isUploading || imageCount < 2}
                onPress={() => navigation.navigate('FirstName')}
            >
                <Text style={styles.nextButtonText}>NEXT</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.dark,
    },
    content: {
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.l,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginTop: SPACING.l,
    },
    subtitle: {
        color: COLORS.lightGrey,
        fontSize: 16,
        marginTop: 10,
        marginBottom: SPACING.xl,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    imageBox: {
        width: GRID_SIZE,
        height: GRID_SIZE * 1.25,
        backgroundColor: COLORS.grey,
        borderRadius: 10,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    addButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 5,
        right: 5,
        borderWidth: 2,
        borderColor: COLORS.dark,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButton: {
        backgroundColor: 'white',
        margin: SPACING.m,
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        height: 55,
        justifyContent: 'center',
    },
    nextButtonDisabled: {
        backgroundColor: COLORS.grey,
    },
    nextButtonText: {
        color: COLORS.dark,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default PhotoUploadScreen;