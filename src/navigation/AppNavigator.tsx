import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { MainNavigator } from './MainNavigator';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';

export const AppNavigator = () => {
  const { isLoggedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null; // Or render a splash screen
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
