import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MapPin } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { FONTS } from '../theme/typography';

export const MapPreview = ({ latitude, longitude, name, address }: { latitude?: number, longitude?: number, name: string, address: string }) => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  if (!latitude || !longitude) {
    return (
      <View style={[s.container, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
        <MapPin color={colors.midTeal} size={36} strokeWidth={2.5} />
        <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: colors.textDark, marginTop: 6 }}>Location Unavailable</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <MapView
        style={{ width: '100%', height: '100%' }}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={name}
          description={address}
        />
      </MapView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { height: 140, borderRadius: 16, overflow: 'hidden' },
});
