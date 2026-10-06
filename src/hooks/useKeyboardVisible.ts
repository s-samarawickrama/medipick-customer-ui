import { useState, useEffect } from 'react';
import { Keyboard } from 'react-native';

/**
 * A custom hook to detect if the software keyboard is visible.
 * Useful for adjusting UI layouts (like hiding bottom tabs) when the keyboard is open.
 */
export const useKeyboardVisible = (): boolean => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    // Professional practice: Always clean up event listeners to prevent memory leaks
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return isKeyboardVisible;
};
