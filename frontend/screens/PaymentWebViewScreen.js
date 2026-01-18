import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { themes } from '../utils/themes';
import axios from 'axios';

// BU DOSYADA constants OLMADIĞI İÇİN process.env KULLANACAĞIM
// Ancak constants.js'i sildiğim için burada direkt process.env kullanacağım, veya önceki adımdaki gibi API_BASE_URL tanımlayacağım.
// Kullanıcı constants dosyasını sildirdiği için process.env kullanıyorum.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const PaymentWebViewScreen = ({ route, navigation }) => {
  const { paymentUrl, conversationId, eventData } = route.params;
  const currentTheme = useSelector((state) => state.theme.theme);
  const currentLanguage = useSelector((state) => state.language.language);
  const token = useSelector((state) => state.auth.token);
  const themeColors = themes[currentTheme];

  const [loading, setLoading] = useState(true);
  const [processed, setProcessed] = useState(false); // Çift işlemi engelle

  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;

    // Çift işlemi engelle
    if (processed) return;

    // Ödeme başarılı - sadece bildirim göster, etkinlik backend'de oluşturuldu
    // Iyzico başarılı sayfasını veya bizim redirect sayfamızı yakala
    if (url.includes('payment-success') || url.includes('success') || url.includes('Result')) {
      if (processed) return;
      setProcessed(true);

      try {
        // 1. Ödemeyi onayla
        await axios.post(
          `${API_URL}/payment/confirm-payment`,
          { conversationId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // 2. Etkinliği oluştur
        await axios.post(
          `${API_URL}/payment/complete-event`,
          {
            conversationId,
            eventData,
            // rentalPlan ve storagePlan backend'de payment kaydından alınacak
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Alert.alert(
          currentLanguage === 'tr' ? 'Başarılı' : 'Success',
          currentLanguage === 'tr' ? 'Ödeme tamamlandı ve etkinlik oluşturuldu!' : 'Payment completed and event created!',
          [
            {
              text: 'OK',
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              }),
            },
          ]
        );
      } catch (error) {
        console.error("Payment confirmation error:", error);
        Alert.alert(
          currentLanguage === 'tr' ? 'Hata' : 'Error',
          currentLanguage === 'tr' ? 'Etkinlik oluşturulurken bir hata oluştu.' : 'Error creating event.'
        );
      }
    }

    // Ödeme başarısız
    if (url.includes('payment-failed')) {
      setProcessed(true);
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
