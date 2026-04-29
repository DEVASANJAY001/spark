import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    FlatList,
    Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';

const { height } = Dimensions.get('window');

const HeightPickerModal = ({ visible, selectedValue, onSelect, onClose }) => {
    // Generate heights from 140cm to 220cm
    const heights = Array.from({ length: 81 }, (_, i) => 140 + i);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                style={styles.overlay}
                onPress={onClose}
            >
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Height</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.doneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={heights}
                        keyExtractor={(item) => item.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.option,
                                    selectedValue === item && styles.selectedOption
                                ]}
                                onPress={() => onSelect(item)}
                            >
                                <Text style={[
                                    styles.optionText,
                                    selectedValue === item && styles.selectedOptionText
                                ]}>
                                    {item} cm
                                </Text>
                                {selectedValue === item && (
                                    <View style={styles.checkCircle}>
                                        <View style={styles.checkInner} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                        initialScrollIndex={selectedValue ? Math.max(0, heights.indexOf(selectedValue) - 3) : 30}
                        getItemLayout={(data, index) => (
                            { length: 60, offset: 60 * index, index }
                        )}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        height: height * 0.5,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    doneText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 60,
        paddingHorizontal: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    selectedOption: {
        backgroundColor: COLORS.primary + '11',
    },
    optionText: {
        color: '#ccc',
        fontSize: 18,
    },
    selectedOptionText: {
        color: 'white',
        fontWeight: 'bold',
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    }
});

export default HeightPickerModal;
