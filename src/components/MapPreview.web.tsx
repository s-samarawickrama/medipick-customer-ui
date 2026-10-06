import React from 'react';
import { View, StyleSheet } from 'react-native';

export const MapPreview = ({ latitude, longitude, name, address }: { latitude?: number, longitude?: number, name: string, address: string }) => {
  return (
    <View style={s.container}>
      <iframe
        src={`https://maps.google.com/maps?q=${latitude || 6.9034},${longitude || 79.8540}&z=15&output=embed`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen={false}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { height: 140, borderRadius: 16, overflow: 'hidden' },
});
