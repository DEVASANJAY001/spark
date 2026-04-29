import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HouseRulesScreen from '../screens/onboarding/HouseRulesScreen';
import FirstNameScreen from '../screens/onboarding/FirstNameScreen';
import BirthdayScreen from '../screens/onboarding/BirthdayScreen';
import GenderScreen from '../screens/onboarding/GenderScreen';
import SexualOrientationScreen from '../screens/onboarding/SexualOrientationScreen';
import InterestedInScreen from '../screens/onboarding/InterestedInScreen';
import DistancePreferenceScreen from '../screens/onboarding/DistancePreferenceScreen';
import RelationshipGoalScreen from '../screens/onboarding/RelationshipGoalScreen';
import SchoolScreen from '../screens/onboarding/SchoolScreen';
import LifestyleHabitsScreen from '../screens/onboarding/LifestyleHabitsScreen';
import PersonalityTraitsScreen from '../screens/onboarding/PersonalityTraitsScreen';
import InterestsScreen from '../screens/onboarding/InterestsScreen';
import PhotoUploadScreen from '../screens/onboarding/PhotoUploadScreen';
import BioAndPromptsScreen from '../screens/onboarding/BioAndPromptsScreen';

const Stack = createNativeStackNavigator();

const OnboardingStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HouseRules" component={HouseRulesScreen} />
            <Stack.Screen name="FirstName" component={FirstNameScreen} />
            <Stack.Screen name="Birthday" component={BirthdayScreen} />
            <Stack.Screen name="Gender" component={GenderScreen} />
            <Stack.Screen name="SexualOrientation" component={SexualOrientationScreen} />
            <Stack.Screen name="InterestedIn" component={InterestedInScreen} />
            <Stack.Screen name="DistancePreference" component={DistancePreferenceScreen} />
            <Stack.Screen name="RelationshipGoal" component={RelationshipGoalScreen} />
            <Stack.Screen name="School" component={SchoolScreen} />
            <Stack.Screen name="LifestyleHabits" component={LifestyleHabitsScreen} />
            <Stack.Screen name="PersonalityTraits" component={PersonalityTraitsScreen} />
            <Stack.Screen name="Interests" component={InterestsScreen} />
            <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
            <Stack.Screen name="BioAndPrompts" component={BioAndPromptsScreen} />
        </Stack.Navigator>
    );
};

export default OnboardingStack;