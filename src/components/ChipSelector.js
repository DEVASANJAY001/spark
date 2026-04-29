import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

const ChipSelector = ({ options, selectedOptions, onSelect, multiSelect = false }) => {
    const isSelected = (option) => {
        if (multiSelect) {
            return selectedOptions.includes(option);
        }
        return selectedOptions === option;
    };

    return (
        <View style={styles.container}>
            {options.map((option) => (
                <TouchableOpacity
                    key={option}
                    style={[
                        styles.chip,
                        isSelected(option) && styles.chipActive
                    ]}
                    onPress={() => onSelect(option)}
                >
                    <Text style={[
                        styles.chipText,
                        isSelected(option) && styles.chipTextActive
                    ]}>
                        {option}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        borderWidth: 1,
        borderColor: COLORS.lightGrey,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        marginBottom: 10,
    },
    chipActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '20', // Add a bit of transparency
    },
    chipText: {
        color: COLORS.lightGrey,
        fontSize: 14,
        fontWeight: '600',
    },
    chipTextActive: {
        color: COLORS.primary,
    },
});

export default ChipSelector;