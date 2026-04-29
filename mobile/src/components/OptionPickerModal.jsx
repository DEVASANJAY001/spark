import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';

const { height } = Dimensions.get('window');

const OptionPickerModal = ({ visible, title, options, selectedValue, onSelect, onClose }) => {
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
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.doneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.scroll}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.option,
                                    selectedValue === option && styles.selectedOption
                                ]}
                                onPress={() => onSelect(option)}
                            >
                                <Text style={[
                                    styles.optionText,
                                    selectedValue === option && styles.selectedOptionText
                                ]}>
                                    {option}
                                </Text>
                                {selectedValue === option && (
                                    <View style={styles.checkCircle}>
                                        <View style={styles.checkInner} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
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
        height: height * 0.6,
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
    scroll: {
        flex: 1,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    selectedOption: {
        backgroundColor: COLORS.primary + '11',
    },
    optionText: {
        color: '#ccc',
        fontSize: 16,
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

export default OptionPickerModal;
