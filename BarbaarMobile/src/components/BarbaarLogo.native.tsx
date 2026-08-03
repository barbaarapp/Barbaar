import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../constants';

interface BarbaarLogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export const BarbaarLogo: React.FC<BarbaarLogoProps> = ({
  size = 28,
  showText = true,
  variant = 'light',
}) => {
  const textColor = variant === 'dark' ? colors.ivory : colors.ink;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { width: size + 10, height: size + 10, borderRadius: 10 }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Rounded background circle */}
          <Path
            d="M50 0C77.6142 0 100 22.3858 100 50C100 77.6142 77.6142 100 50 100C22.3858 100 0 77.6142 0 50C0 22.3858 22.3858 0 50 0Z"
            fill="#EAF3E9"
          />
          {/* Green leaf canopy */}
          <Path
            d="M50 15C32 15 20 28 20 45C20 62 33 75 50 85C67 75 80 62 80 45C80 28 68 15 50 15Z"
            fill="#64A461"
          />
          {/* Inner leaf vein detailing */}
          <Path
            d="M50 24C40 24 30 32 30 45C30 58 40 68 50 75C60 68 70 58 70 45C70 32 60 24 50 24Z"
            fill="#384C43"
          />
          <Path
            d="M50 32C44 32 38 37 38 45C38 53 44 60 50 64C56 60 62 53 62 45C62 37 56 32 50 32Z"
            fill="#EAF3E9"
          />
        </Svg>
      </View>

      {showText && (
        <View style={styles.textColumn}>
          <Text style={[styles.brandTitle, { color: textColor }]}>Barbaar Wellness</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: '#EAF3E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4E6D2',
    shadowColor: '#384C43',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  textColumn: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
