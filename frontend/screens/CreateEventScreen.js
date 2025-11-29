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

const API_URL = 'http://192.168.43.117:5000/api';

const CreateEventScreen = ({ navigation }) => {
  const currentTheme = useSelector((state) => state.theme.theme);
  const currentLanguage = useSelector((state) => state.language.language);
  const token = useSelector((state) => state.auth.token);
  const themeColors = themes[currentTheme];

  const [step, setStep] = useState(1);
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [rentalPlan, setRentalPlan] = useState('');
  const [storagePlan, setStoragePlan] = useState('');
  const [showRentalPicker, setShowRentalPicker] = useState(false);
  const [showStoragePicker, setShowStoragePicker] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [pricingPlans, setPricingPlans] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  useEffect(() => {
    if (pricingPlans) {
      calculateTotalPrice();
    }
  }, [rentalPlan, storagePlan, pricingPlans]);

  const fetchPricingPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/payment/pricing`);
      setPricingPlans(response.data);
    } catch (error) {
      console.error('Pricing fetch error:', error);
    }
  };

  const calculateTotalPrice = () => {
    if (!pricingPlans || !rentalPlan || !storagePlan) {
      setPricing(null);
      return;
    }

    const rental = pricingPlans.rental[rentalPlan];
    const storage = pricingPlans.storage[storagePlan];

    setPricing({
      rentalPrice: rental.price,
      storagePrice: storage.price,
      totalPrice: rental.price + storage.price,
      rentalLabel: rental.label,
      storageLabel: storage.label,
    });
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
    if (!rentalPlan || !storagePlan) {
      Alert.alert(
        currentLanguage === 'tr' ? 'Hata' : 'Error',
        currentLanguage === 'tr' ? 'Lütfen kiralama ve saklama sürelerini seçin' : 'Please select rental and storage durations'
      );
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        name: eventName,
        description: eventDescription,
      };

      if (pricing && pricing.totalPrice === 0) {
        // Ücretsiz plan - direkt etkinlik oluştur
        const response = await axios.post(
          `${API_URL}/payment/complete-event`,
          {
            conversationId: `free-${Date.now()}`,
            eventData,
            rentalPlan,
            storagePlan,
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
            rentalPlan,
            storagePlan,
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
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                {currentLanguage === 'tr' ? 'Kiralama Süresi' : 'Rental Duration'}
              </Text>
              <TouchableOpacity
                style={[styles.picker, {
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.border,
                }]}
                onPress={() => setShowRentalPicker(true)}
              >
                <Text style={[styles.pickerText, { color: rentalPlan ? themeColors.text : themeColors.secondaryText }]}>
                  {rentalPlan ? pricingPlans.rental[rentalPlan].label : (currentLanguage === 'tr' ? 'Seçiniz' : 'Select')}
                </Text>
                <Feather name="chevron-down" size={20} color={themeColors.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                {currentLanguage === 'tr' ? 'Saklama Süresi' : 'Storage Duration'}
              </Text>
              <TouchableOpacity
                style={[styles.picker, {
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.border,
                }]}
                onPress={() => setShowStoragePicker(true)}
              >
                <Text style={[styles.pickerText, { color: storagePlan ? themeColors.text : themeColors.secondaryText }]}>
                  {storagePlan ? pricingPlans.storage[storagePlan].label : (currentLanguage === 'tr' ? 'Seçiniz' : 'Select')}
                </Text>
                <Feather name="chevron-down" size={20} color={themeColors.secondaryText} />
              </TouchableOpacity>
            </View>

            {pricing && (
              <View style={[styles.invoiceContainer, {
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.border,
              }]}>
                <Text style={[styles.invoiceTitle, { color: themeColors.text }]}>
                  {currentLanguage === 'tr' ? 'Fatura Özeti' : 'Invoice Summary'}
                </Text>

                <View style={styles.invoiceRow}>
                  <Text style={[styles.invoiceLabel, { color: themeColors.secondaryText }]}>
                    {currentLanguage === 'tr' ? 'Kiralama:' : 'Rental:'}
                  </Text>
                  <Text style={[styles.invoiceValue, { color: themeColors.text }]}>
                    {pricing.rentalPrice === 0 ? (currentLanguage === 'tr' ? 'Ücretsiz' : 'Free') : `₺${pricing.rentalPrice.toFixed(2)}`}
                  </Text>
                </View>

                <View style={styles.invoiceRow}>
                  <Text style={[styles.invoiceLabel, { color: themeColors.secondaryText }]}>
                    {currentLanguage === 'tr' ? 'Saklama:' : 'Storage:'}
                  </Text>
                  <Text style={[styles.invoiceValue, { color: themeColors.text }]}>
                    {pricing.storagePrice === 0 ? (currentLanguage === 'tr' ? 'Ücretsiz' : 'Free') : `₺${pricing.storagePrice.toFixed(2)}`}
                  </Text>
                </View>

                <View style={[styles.invoiceDivider, { backgroundColor: themeColors.border }]} />

                <View style={styles.invoiceRow}>
                  <Text style={[styles.invoiceTotalLabel, { color: themeColors.text }]}>
                    {currentLanguage === 'tr' ? 'Toplam:' : 'Total:'}
                  </Text>
                  <Text style={[styles.invoiceTotalValue, { color: themeColors.primary }]}>
                    {pricing.totalPrice === 0 ? (currentLanguage === 'tr' ? 'Ücretsiz' : 'Free') : `₺${pricing.totalPrice.toFixed(2)}`}
                  </Text>
                </View>
              </View>
            )}

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
                    {pricing && pricing.totalPrice > 0
                      ? (currentLanguage === 'tr' ? 'Öde ve Oluştur' : 'Pay & Create')
                      : (currentLanguage === 'tr' ? 'Oluştur' : 'Create')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Rental Plan Picker Modal */}
      <Modal
        visible={showRentalPicker}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowRentalPicker(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              {currentLanguage === 'tr' ? 'Kiralama Süresi Seçin' : 'Select Rental Duration'}
            </Text>
          </View>
          <ScrollView>
            {Object.keys(pricingPlans.rental).map((key) => {
              const plan = pricingPlans.rental[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.planOption, {
                    backgroundColor: rentalPlan === key ? themeColors.primary + '20' : themeColors.cardBackground,
                    borderColor: rentalPlan === key ? themeColors.primary : themeColors.border,
                  }]}
                  onPress={() => {
                    setRentalPlan(key);
                    setShowRentalPicker(false);
                  }}
                >
                  <Text style={[styles.planLabel, { color: themeColors.text }]}>
                    {plan.label}
                  </Text>
                  <Text style={[styles.planPrice, { color: plan.price === 0 ? '#4CAF50' : themeColors.primary }]}>
                    {plan.price === 0 ? (currentLanguage === 'tr' ? 'Ücretsiz' : 'Free') : `₺${plan.price.toFixed(2)}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalCloseButton, { backgroundColor: themeColors.border }]}
            onPress={() => setShowRentalPicker(false)}
          >
            <Text style={[styles.modalCloseButtonText, { color: themeColors.text }]}>
              {currentLanguage === 'tr' ? 'Kapat' : 'Close'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* Storage Plan Picker Modal */}
      <Modal
        visible={showStoragePicker}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowStoragePicker(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              {currentLanguage === 'tr' ? 'Saklama Süresi Seçin' : 'Select Storage Duration'}
            </Text>
          </View>
          <ScrollView>
            {Object.keys(pricingPlans.storage).map((key) => {
              const plan = pricingPlans.storage[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.planOption, {
                    backgroundColor: storagePlan === key ? themeColors.primary + '20' : themeColors.cardBackground,
                    borderColor: storagePlan === key ? themeColors.primary : themeColors.border,
                  }]}
                  onPress={() => {
                    setStoragePlan(key);
                    setShowStoragePicker(false);
                  }}
                >
                  <Text style={[styles.planLabel, { color: themeColors.text }]}>
                    {plan.label}
                  </Text>
                  <Text style={[styles.planPrice, { color: plan.price === 0 ? '#4CAF50' : themeColors.primary }]}>
                    {plan.price === 0 ? (currentLanguage === 'tr' ? 'Ücretsiz' : 'Free') : `₺${plan.price.toFixed(2)}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalCloseButton, { backgroundColor: themeColors.border }]}
            onPress={() => setShowStoragePicker(false)}
          >
            <Text style={[styles.modalCloseButtonText, { color: themeColors.text }]}>
              {currentLanguage === 'tr' ? 'Kapat' : 'Close'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
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
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 15,
    flex: 1,
  },
  invoiceContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  invoiceLabel: {
    fontSize: 14,
  },
  invoiceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  invoiceDivider: {
    height: 1,
    marginVertical: 15,
  },
  invoiceTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  invoiceTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  planOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 2,
  },
  planLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateEventScreen;
