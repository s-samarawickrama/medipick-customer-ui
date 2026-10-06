import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';
import { DARK_COLORS } from '../theme/darkColors';

export type ThemeColors = typeof COLORS;

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme_is_dark');
      if (savedTheme !== null) {
        setIsDark(JSON.parse(savedTheme));
      } else {
        setIsDark(true);
      }
    } catch (e) {
      console.warn('Failed to load theme preference', e);
      setIsDark(true);
    } finally {
      setIsLoaded(true);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('@theme_is_dark', JSON.stringify(newTheme));
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const colors = isDark ? DARK_COLORS : COLORS;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
