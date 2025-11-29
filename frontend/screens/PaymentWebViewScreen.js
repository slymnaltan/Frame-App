import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { themes } from '../utils/themes';
import axios from 'axios';

const API_URL = 'http://192.168.43.117:5000/api';

const PaymentWebViewScreen = ({ route, navigation }) => {
  const { paymentUrl, conversationId, eventData } = route.params;
  const currentTheme = useSelector((state) => state.theme.theme);
  const currentLanguage = useSelector((state) => state.language.language);
  const token = useSelector((state) => state.auth.token);
  const themeColors = themes[currentTheme];

  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;

    // Ödeme başarılı
    if (url.includes('payment-success')) {
      try {
        // Etkinlik oluştur
        const response = await axios.post(
          `${API_URL}/payment/complete-event`,
          {
            conversationId,
            eventData,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        Alert.alert(
          currentLanguage === 'tr' ? 'Başarılı' : 'Success',
          currentLanguage === 'tr' ? 'Ödeme tamamlandı ve etkinlik oluşturuldu!' : 'Payment completed and event created!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      } catch (error) {
        console.error('Complete event error:', error);
        Alert.alert(
          currentLanguage === 'tr' ? 'Hata' : 'Error',
          currentLanguage === 'tr' ? 'Ödeme başarılı ancak etkinlik oluşturulamadı' : 'Payment successful but event creation failed'
        );
        navigation.goBack();
      }
    }

    // Ödeme başarısız
    if (url.includes('payment-failed')) {
      Alert.alert(
        currentLanguage === 'tr' ? 'Ödeme Başarısız' : 'Payment Failed',
        currentLanguage === 'tr' ? 'Ödeme işlemi başarısız oldu' : 'Payment process failed',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        style={styles.webview}
      />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default PaymentWebViewScreen;
