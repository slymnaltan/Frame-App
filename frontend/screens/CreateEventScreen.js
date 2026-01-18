import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { themes } from '../utils/themes';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://frame-app.onrender.com/api';

const CreateEventScreen = ({ navigation }) => {
  const currentTheme = useSelector((state) => state.theme.theme);
  const currentLanguage = useSelector((state) => state.language.language);
  const token = useSelector((state) => state.auth.token);
  const themeColors = themes[currentTheme];

  const [step, setStep] = useState(1);
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [pricingPlans, setPricingPlans] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/payment/pricing`);
      // response.data artık { PACKAGES: { ... } } dönüyor
      setPricingPlans(response.data.PACKAGES);
    } catch (error) {
      console.error('Pricing fetch error:', error);
    }
  };

  const handleContinue = () => {
    if (!eventName.trim()) {
      Alert.alert(
        currentLanguage === 'tr' ? 'Hata' : 'Error',
        currentLanguage === 'tr' ? 'Etkinlik adı zorunludur' : 'Event name is required'
      );
      return;
    }
    setStep(2);
  };

  const handleCreateEvent = async () => {
    if (!selectedPlanId) {
      Alert.alert(
        currentLanguage === 'tr' ? 'Hata' : 'Error',
        currentLanguage === 'tr' ? 'Lütfen bir paket seçin' : 'Please select a package'
      );
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        name: eventName,
        description: eventDescription,
      };

      const selectedPlan = pricingPlans[selectedPlanId];

      if (selectedPlan && selectedPlan.price === 0) {
        // Ücretsiz plan - direkt etkinlik oluştur
        const response = await axios.post(
          `${API_URL}/payment/complete-event`,
          {
            conversationId: `free-${Date.now()}`,
            eventData,
            planId: selectedPlanId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        Alert.alert(
          currentLanguage === 'tr' ? 'Başarılı' : 'Success',
          currentLanguage === 'tr' ? 'Etkinlik oluşturuldu' : 'Event created successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      } else {
        // Ücretli plan - ödeme başlat
        const response = await axios.post(
          `${API_URL}/payment/initialize`,
          {
            planId: selectedPlanId,
            eventData,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success && response.data.paymentPageUrl) {
          // Ödeme sayfasına yönlendir (WebView ile açılacak)
          navigation.navigate('PaymentWebView', {
            paymentUrl: response.data.paymentPageUrl,
            conversationId: response.data.conversationId,
            eventData,
          });
        }
      }
    } catch (error) {
      console.error('Create event error:', error);
      Alert.alert(
        currentLanguage === 'tr' ? 'Hata' : 'Error',
        error.response?.data?.error || (currentLanguage === 'tr' ? 'Etkinlik oluşturulamadı' : 'Failed to create event')
      );
    } finally {
      setLoading(false);
    }
  };

  if (!pricingPlans) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {currentLanguage === 'tr' ? 'Yeni Etkinlik Oluştur' : 'Create New Event'}
        </Text>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                {currentLanguage === 'tr' ? 'Etkinlik Adı' : 'Event Name'} *
              </Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: themeColors.cardBackground,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                }]}
                placeholder={currentLanguage === 'tr' ? 'Örn: Düğün, Doğum Günü' : 'e.g. Wedding, Birthday'}
                placeholderTextColor={themeColors.secondaryText}
                value={eventName}
                onChangeText={setEventName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                {currentLanguage === 'tr' ? 'Açıklama' : 'Description'}
              </Text>
              <TextInput
                style={[styles.textArea, {
                  backgroundColor: themeColors.cardBackground,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                }]}
                placeholder={currentLanguage === 'tr' ? 'Etkinlik hakkında kısa açıklama' : 'Brief description about the event'}
                placeholderTextColor={themeColors.secondaryText}
                value={eventDescription}
                onChangeText={setEventDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.buttonBackground }]}
              onPress={handleContinue}
            >
              <Text style={[styles.buttonText, { color: themeColors.buttonText }]}>
                {currentLanguage === 'tr' ? 'Devam Et' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              {currentLanguage === 'tr' ? 'Paket Seçimi' : 'Select Package'}
            </Text>

            {Object.keys(pricingPlans).map((key) => {
              const plan = pricingPlans[key];
              const isSelected = selectedPlanId === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.packageCard, {
                    backgroundColor: isSelected ? themeColors.primary + '15' : themeColors.cardBackground,
                    borderColor: isSelected ? themeColors.primary : themeColors.border,
                    borderWidth: isSelected ? 2 : 1,
                  }]}
                  onPress={() => setSelectedPlanId(key)}
                >
                  <View style={styles.packageHeader}>
                    <Text style={[styles.packageName, { color: themeColors.text, fontWeight: isSelected ? 'bold' : '600' }]}>
                      {plan.name}
                    </Text>
                    <Text style={[styles.packagePrice, { color: plan.price === 0 ? '#4CAF50' : themeColors.primary }]}>
                      {plan.price === 0 ? (currentLanguage === 'tr' ? 'Ücretsiz' : 'Free') : `₺${plan.price}`}
                    </Text>
                  </View>
                  <Text style={[styles.packageLabel, { color: themeColors.secondaryText }]}>
                    {plan.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.backButton, { borderColor: themeColors.border }]}
                onPress={() => setStep(1)}
              >
                <Text style={[styles.backButtonText, { color: themeColors.text }]}>
                  {currentLanguage === 'tr' ? 'Geri' : 'Back'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: themeColors.buttonBackground }]}
                onPress={handleCreateEvent}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={themeColors.buttonText} />
                ) : (
                  <Text style={[styles.buttonText, { color: themeColors.buttonText }]}>
                    {selectedPlanId && pricingPlans[selectedPlanId].price > 0
                      ? (currentLanguage === 'tr' ? 'Öde ve Oluştur' : 'Pay & Create')
                      : (currentLanguage === 'tr' ? 'Oluştur' : 'Create')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  stepContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    height: 45,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  packageCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  packageName: {
    fontSize: 16,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  packageLabel: {
    fontSize: 14,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    height: 45,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    height: 45,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    height: 45,
    justifyContent: 'center',
  },
});

export default CreateEventScreen;
