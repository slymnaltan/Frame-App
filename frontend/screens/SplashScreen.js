import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { themes } from '../utils/themes';
import MaskedView from '@react-native-masked-view/masked-view';
import GradientBackground from '../components/GradientBackground';

export default function SplashScreen() {
  const currentTheme = useSelector(state => state.theme.theme);
  const themeColors = themes[currentTheme];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <GradientBackground />
      
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <MaskedView
        maskElement={
          <Text style={styles.taglineText}>Ânı An-ında Yakala</Text>
        }
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Text style={[styles.taglineText, { opacity: 0 }]}>Ânı An-ında Yakala</Text>
        </LinearGradient>
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 240,
    height: 240,
    marginBottom: 20,
  },
  taglineText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  gradient: {
    paddingVertical: 4,
  },
});