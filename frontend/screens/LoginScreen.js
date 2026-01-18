import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/slice/authSlice';
import { themes } from '../utils/themes';
import { translations } from '../utils/translations';
import GradientBackground from '../components/GradientBackground';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: email + security, 2: new password
  const { error, status } = useSelector((state) => state.auth);
  const currentTheme = useSelector(state => state.theme.theme);
  const currentLanguage = useSelector(state => state.language.language);

  const t = translations[currentLanguage];
  const themeColors = themes[currentTheme];

  const handleLogin = () => {
    dispatch(loginUser({ email, password }));
  };

  const handleGetSecurityQuestion = async (email) => {
    if (!email || email.length < 3) {
      setSecurityQuestion('');
      return;
    }

    try {
      const questionResponse = await fetch(`${API_BASE_URL}/auth/get-security-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const questionData = await questionResponse.json();

      if (questionResponse.ok) {
        setSecurityQuestion(questionData.securityQuestion);
      } else {
        setSecurityQuestion('');
      }
    } catch (err) {
      setSecurityQuestion('');
    }
  };

  const handleVerifyAndContinue = async () => {
    if (!resetEmail || !securityAnswer) {
      Alert.alert(
        currentLanguage === 'tr' ? 'Hata' : 'Error',
        currentLanguage === 'tr' ? 'Lütfen tüm alanları doldurun' : 'Please fill all fields'
      );
      return;
    }

    try {
      // Güvenlik cevabını doğrula
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify-security`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, securityAnswer }),
      });
      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok) {
        setResetStep(2);
      } else {
        Alert.alert(
          currentLanguage === 'tr' ? 'Hata' : 'Error',
          verifyData.error || (currentLanguage === 'tr' ? 'Güvenlik cevabı yanlış' : 'Security answer is incorrect')
        );
      }
    } catch (err) {
      Alert.alert(
        currentLanguage === 'tr' ? 'Hata' : 'Error',
        currentLanguage === 'tr' ? 'Bağlantı hatası' : 'Connection error'
      );
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert(
        currentLanguage === 'tr' ? 'Hata' : 'Error',
        currentLanguage === 'tr' ? 'Lütfen tüm alanları doldurun' : 'Please fill all fields'
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert(
        currentLanguage === 'tr' ? 'Hata' : 'Error',
        currentLanguage === 'tr' ? 'Şifreler eşleşmiyor' : 'Passwords do not match'
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, securityAnswer, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          currentLanguage === 'tr' ? 'Başarılı' : 'Success',
          data.message || (currentLanguage === 'tr' ? 'Şifreniz değiştirildi' : 'Password changed successfully')
        );
        setShowForgotPassword(false);
        setResetStep(1);
        setResetEmail('');
        setSecurityQuestion('');
        setSecurityAnswer('');
        setNewPassword('');
        setConfirmNewPassword('');
        setEmail(resetEmail);
      } else {
        Alert.alert(
          currentLanguage === 'tr' ? 'Hata' : 'Error',
          data.error || (currentLanguage === 'tr' ? 'Şifre sıfırlama başarısız' : 'Password reset failed')
        );
      }
    } catch (err) {
      Alert.alert(
        currentLanguage === 'tr' ? 'Hata' : 'Error',
        currentLanguage === 'tr' ? 'Bağlantı hatası' : 'Connection error'
      );
    }
  };

  if (status === 'loading') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          {currentLanguage === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <GradientBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.formContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={{ width: 150, height: 150, alignSelf: 'center', marginBottom: 10 }}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: themeColors.text }]}>
            {currentLanguage === 'tr' ? 'Giriş Yap' : 'Login'}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              {currentLanguage === 'tr' ? 'E-posta' : 'Email'}
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: themeColors.cardBackground,
                color: themeColors.text,
                borderColor: themeColors.border
              }]}
              placeholder={currentLanguage === 'tr' ? 'E-posta adresinizi girin' : 'Enter your email address'}
              placeholderTextColor={themeColors.secondaryText}
              value={email}
              onChangeText={(text) => setEmail(text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              {currentLanguage === 'tr' ? 'Şifre' : 'Password'}
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: themeColors.cardBackground,
                color: themeColors.text,
                borderColor: themeColors.border
              }]}
              placeholder={currentLanguage === 'tr' ? 'Şifrenizi girin' : 'Enter your password'}
              placeholderTextColor={themeColors.secondaryText}
              secureTextEntry
              value={password}
              onChangeText={(text) => setPassword(text)}
            />
          </View>

          {error && (
            <Text style={[styles.errorText, { color: '#E74C3C' }]}>{error}</Text>
          )}

          <TouchableOpacity
            onPress={() => setShowForgotPassword(true)}
            style={styles.forgotPasswordContainer}
          >
            <Text style={[styles.forgotPasswordText, { color: themeColors.primary }]}>
              {currentLanguage === 'tr' ? 'Şifreni mi unuttun?' : 'Forgot Password?'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: themeColors.buttonBackground }]}
            onPress={handleLogin}
          >
            <Text style={[styles.buttonText, { color: themeColors.buttonText }]}>
              {currentLanguage === 'tr' ? 'Giriş Yap' : 'Login'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.orText, { color: themeColors.secondaryText }]}>
            {currentLanguage === 'tr' ? 'veya' : 'or'}
          </Text>

          <TouchableOpacity
            style={[styles.registerButton, { borderColor: themeColors.primary }]}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={[styles.registerButtonText, { color: themeColors.primary }]}>
              {currentLanguage === 'tr' ? 'Hesap Oluştur' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showForgotPassword}
          transparent={false}
          animationType="slide"
          onRequestClose={() => {
            setShowForgotPassword(false);
            setResetStep(1);
          }}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalKeyboardView}
            >
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalInnerContent}>
                  <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                    {currentLanguage === 'tr' ? 'Şifre Sıfırlama' : 'Reset Password'}
                  </Text>

                  {resetStep === 1 && (
                    <>
                      <Text style={[styles.modalDescription, { color: themeColors.secondaryText }]}>
                        {currentLanguage === 'tr'
                          ? 'E-posta adresinizi girin ve güvenlik sorusunu cevaplayın'
                          : 'Enter your email and answer security question'}
                      </Text>

                      <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: themeColors.text }]}>
                          {currentLanguage === 'tr' ? 'E-posta' : 'Email'}
                        </Text>
                        <TextInput
                          style={[styles.modalInput, {
                            backgroundColor: themeColors.cardBackground,
                            color: themeColors.text,
                            borderColor: themeColors.border
                          }]}
                          placeholder={currentLanguage === 'tr' ? 'E-posta adresinizi girin' : 'Enter your email'}
                          placeholderTextColor={themeColors.secondaryText}
                          value={resetEmail}
                          onChangeText={(text) => {
                            setResetEmail(text);
                            setSecurityAnswer('');
                            handleGetSecurityQuestion(text);
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>

                      {securityQuestion && (
                        <>
                          <View style={[styles.questionBox, { backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }]}>
                            <Text style={[styles.questionLabel, { color: themeColors.secondaryText }]}>
                              {currentLanguage === 'tr' ? 'Güvenlik Sorusu:' : 'Security Question:'}
                            </Text>
                            <Text style={[styles.questionText, { color: themeColors.text }]}>
                              {securityQuestion}
                            </Text>
                          </View>

                          <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: themeColors.text }]}>
                              {currentLanguage === 'tr' ? 'Cevabınız' : 'Your Answer'}
                            </Text>
                            <TextInput
                              style={[styles.modalInput, {
                                backgroundColor: themeColors.cardBackground,
                                color: themeColors.text,
                                borderColor: themeColors.border
                              }]}
                              placeholder={currentLanguage === 'tr' ? 'Güvenlik sorusu cevabınız' : 'Your security answer'}
                              placeholderTextColor={themeColors.secondaryText}
                              value={securityAnswer}
                              onChangeText={setSecurityAnswer}
                            />
                          </View>

                          <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: themeColors.buttonBackground }]}
                            onPress={handleVerifyAndContinue}
                          >
                            <Text style={[styles.modalButtonText, { color: themeColors.buttonText }]}>
                              {currentLanguage === 'tr' ? 'Doğrula ve Devam Et' : 'Verify and Continue'}
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  )}

                  {resetStep === 2 && (
                    <>
                      <Text style={[styles.modalDescription, { color: themeColors.secondaryText }]}>
                        {currentLanguage === 'tr'
                          ? 'Yeni şifrenizi belirleyin'
                          : 'Set your new password'}
                      </Text>

                      <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: themeColors.text }]}>
                          {currentLanguage === 'tr' ? 'Yeni Şifre' : 'New Password'}
                        </Text>
                        <TextInput
                          style={[styles.modalInput, {
                            backgroundColor: themeColors.cardBackground,
                            color: themeColors.text,
                            borderColor: themeColors.border
                          }]}
                          placeholder={currentLanguage === 'tr' ? 'Yeni şifrenizi girin' : 'Enter new password'}
                          placeholderTextColor={themeColors.secondaryText}
                          secureTextEntry
                          value={newPassword}
                          onChangeText={setNewPassword}
                        />
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: themeColors.text }]}>
                          {currentLanguage === 'tr' ? 'Şifre Tekrar' : 'Confirm Password'}
                        </Text>
                        <TextInput
                          style={[styles.modalInput, {
                            backgroundColor: themeColors.cardBackground,
                            color: themeColors.text,
                            borderColor: themeColors.border
                          }]}
                          placeholder={currentLanguage === 'tr' ? 'Şifrenizi tekrar girin' : 'Confirm your password'}
                          placeholderTextColor={themeColors.secondaryText}
                          secureTextEntry
                          value={confirmNewPassword}
                          onChangeText={setConfirmNewPassword}
                        />
                      </View>

                      <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: themeColors.buttonBackground }]}
                        onPress={handleResetPassword}
                      >
                        <Text style={[styles.modalButtonText, { color: themeColors.buttonText }]}>
                          {currentLanguage === 'tr' ? 'Şifreyi Yenile ve Onayla' : 'Reset and Confirm'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={[styles.modalCancelButton, { borderColor: themeColors.border }]}
                    onPress={() => {
                      setShowForgotPassword(false);
                      setResetStep(1);
                      setResetEmail('');
                      setSecurityQuestion('');
                      setSecurityAnswer('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                  >
                    <Text style={[styles.modalCancelButtonText, { color: themeColors.text }]}>
                      {currentLanguage === 'tr' ? 'İptal' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
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
  loadingText: {
    fontSize: 18,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    height: 45,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 13,
  },
  loginButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    height: 45,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  registerButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    height: 45,
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  modalInnerContent: {
    paddingHorizontal: 30,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    height: 45,
  },
  questionBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    marginBottom: 15,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    height: 45,
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 10,
    height: 45,
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default LoginScreen;
