import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';

const HouseRulesScreen = ({ navigation }) => {
    const rules = [
        { title: 'Be yourself.', desc: 'Make sure your photos, age, and bio are true to who you are.' },
        { title: 'Stay safe.', desc: "Don't be too quick to give out personal information." },
        { title: 'Play it cool.', desc: 'Respect others and treat them the way you would like to be treated.' },
        { title: 'Be proactive.', desc: 'Always report bad behavior.' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Ionicons name="flame" size={50} color={COLORS.primary} style={styles.logo} />
                <Text style={styles.title}>Welcome to Spark.</Text>
                <Text style={styles.subtitle}>Please follow these House Rules.</Text>

                <View style={styles.rulesContainer}>
                    {rules.map((rule, index) => (
                        <View key={index} style={styles.ruleItem}>
                            <Text style={styles.ruleTitle}>{rule.title}</Text>
                            <Text style={styles.ruleDesc}>{rule.desc}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('FirstName')}
            >
                <Text style={styles.buttonText}>I AGREE</Text>
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
        paddingTop: 50,
        paddingBottom: SPACING.l,
    },
    logo: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    subtitle: {
        color: COLORS.lightGrey,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: SPACING.xl,
    },
    rulesContainer: {
        marginTop: SPACING.m,
    },
    ruleItem: {
        marginBottom: SPACING.l,
    },
    ruleTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    ruleDesc: {
        color: COLORS.lightGrey,
        fontSize: 14,
        lineHeight: 20,
    },
    button: {
        backgroundColor: COLORS.primary,
        margin: SPACING.m,
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default HouseRulesScreen;