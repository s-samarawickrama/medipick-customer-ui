import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OTPScreen } from '../screens/auth/OTPScreen';

import { LegalDocScreen } from '../screens/legal/LegalDocScreen';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  OTP: { phone: string; surname: string };
  LegalDoc: { type: 'terms' | 'privacy' };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="OTP" component={OTPScreen as any} />
    <Stack.Screen name="LegalDoc" component={LegalDocScreen} />
  </Stack.Navigator>
);
