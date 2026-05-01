import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';

const HouseRulesScreen = ({ navigation }) => {
    const rules = [
        { title: 'Be yourself.', desc: 'Make sure your photos, age, and bio are true to who you are.', icon: 'person' },
        { title: 'Stay safe.', desc: "Don't be too quick to give out personal information.", icon: 'shield-checkmark' },
        { title: 'Play it cool.', desc: 'Respect others and treat them the way you would like to be treated.', icon: 'heart' },
        { title: 'Be proactive.', desc: 'Always report bad behavior.', icon: 'alert-circle' },
    ];

    return (
        <OnboardingBase
            title="House Rules"
            subtitle="Please follow these rules to keep Spark a safe and fun place for everyone."
            onNext={() => navigation.navigate('PhotoUpload')}
            nextLabel="I AGREE"
            hideBack
            progress={0.05}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.rulesContainer}>
                    {rules.map((rule, index) => (
                        <View key={index} style={styles.ruleItem}>
                            <View style={styles.iconBox}>
                                <Ionicons name={rule.icon} size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.ruleContent}>
                                <Text style={styles.ruleTitle}>{rule.title}</Text>
                                <Text style={styles.ruleDesc}>{rule.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </OnboardingBase>
    );
};

const styles = StyleSheet.create({
    rulesContainer: {
        marginTop: 10,
        gap: 25,
    },
    ruleItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        marginTop: 2,
    },
    ruleContent: {
        flex: 1,
    },
    ruleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    ruleDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 20,
    }
});

export default HouseRulesScreen;