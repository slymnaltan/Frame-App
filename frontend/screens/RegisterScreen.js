import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  SafeAreaView, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../redux/slice/authSlice';
import { themes } from '../utils/themes';
import { translations } from '../utils/translations';

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const { error, status } = useSelector((state) => state.auth);
  const currentTheme = useSelector(state => state.theme.theme);
  const currentLanguage = useSelector(state => state.language.language);

  const t = translations[currentLanguage];
  const themeColors = themes[currentTheme];
  
  const securityQuestions = currentLanguage === 'tr' ? [
    'İlk evcil hayvanınızın adı neydi?',
    'Annenizin kızlık soyadı nedir?',
    'İlk okulunuzun adı neydi?'
  ] : [
    'What was the name of your first pet?',
    'What is your mother\'s maiden name?',
    'What was the name of your first school?'
  ];
  
  const handleRegister = () => {
    if (password !== confirmPassword) {
      Alert.alert(
        currentLanguage === 'tr' ? 'Hata' : 'Error',
        currentLanguage === 'tr' ? 'Şifreler eşleşmiyor!' : 'Passwords do not match!'
      );
      return;
    }
    if (!securityQuestion || !securityAnswer) {
      Alert.alert(
        currentLanguage === 'tr' ? 'Hata' : 'Error',
        currentLanguage === 'tr' ? 'Lütfen güvenlik sorusu ve cevabını girin!' : 'Please select security question and answer!'
      );
      return;
    }
    dispatch(registerUser({ name, email, password, securityQuestion, securityAnswer }))
      .unwrap()
      .then((message) => {
        Alert.alert(
          currentLanguage === 'tr' ? 'Başarılı' : 'Success',
          currentLanguage === 'tr' ? (message || 'Kayıt tamamlandı.') : (message || 'Registration completed.'),
          [
            {
              text: currentLanguage === 'tr' ? 'Giriş Yap' : 'Login',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      })
      .catch((err) => {
        const msg = typeof err === 'string' ? err : (currentLanguage === 'tr' ? 'Kayıt başarısız. Lütfen tekrar deneyin.' : 'Registration failed. Please try again.');
        Alert.alert(
          currentLanguage === 'tr' ? 'Hata' : 'Error',
          msg
        );
      });
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.formContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={{ width: 120, height: 120, alignSelf: 'center', marginBottom: 15 }}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: themeColors.text }]}>
            {currentLanguage === 'tr' ? 'Hesap Oluştur' : 'Create Account'}
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              {currentLanguage === 'tr' ? 'Ad Soyad' : 'Full Name'}
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: themeColors.cardBackground,
                color: themeColors.text,
                borderColor: themeColors.border
              }]}
              placeholder={currentLanguage === 'tr' ? 'Adınızı ve soyadınızı girin' : 'Enter your full name'}
              placeholderTextColor={themeColors.secondaryText}
              value={name}
              onChangeText={(text) => setName(text)}
            />
          </View>
          
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
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              {currentLanguage === 'tr' ? 'Şifre Tekrar' : 'Confirm Password'}
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: themeColors.cardBackground,
                color: themeColors.text,
                borderColor: themeColors.border
              }]}
              placeholder={currentLanguage === 'tr' ? 'Şifrenizi tekrar girin' : 'Confirm your password'}
              placeholderTextColor={themeColors.secondaryText}
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => setConfirmPassword(text)}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              {currentLanguage === 'tr' ? 'Güvenlik Sorusu' : 'Security Question'}
            </Text>
            <TouchableOpacity
              style={[styles.input, { 
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.border,
                justifyContent: 'center'
              }]}
              onPress={() => setShowQuestionPicker(true)}
            >
              <Text style={[{ color: securityQuestion ? themeColors.text : themeColors.secondaryText }]}>
                {securityQuestion || (currentLanguage === 'tr' ? 'Bir soru seçin' : 'Select a question')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              {currentLanguage === 'tr' ? 'Güvenlik Cevabı' : 'Security Answer'}
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: themeColors.cardBackground,
                color: themeColors.text,
                borderColor: themeColors.border
              }]}
              placeholder={currentLanguage === 'tr' ? 'Cevabınızı girin' : 'Enter your answer'}
              placeholderTextColor={themeColors.secondaryText}
              value={securityAnswer}
              onChangeText={(text) => setSecurityAnswer(text)}
            />
          </View>
          
          {error && (
            <Text style={[styles.errorText, { color: '#E74C3C' }]}>{error}</Text>
          )}
          
          <TouchableOpacity 
            style={[styles.registerButton, { backgroundColor: themeColors.buttonBackground }]} 
            onPress={handleRegister}
          >
            <Text style={[styles.buttonText, { color: themeColors.buttonText }]}>
              {currentLanguage === 'tr' ? 'Hesap Oluştur' : 'Create Account'}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.orText, { color: themeColors.secondaryText }]}>
            {currentLanguage === 'tr' ? 'veya' : 'or'}
          </Text>
          
          <TouchableOpacity 
            style={[styles.loginButton, { borderColor: themeColors.primary }]} 
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={[styles.loginButtonText, { color: themeColors.primary }]}>
              {currentLanguage === 'tr' ? 'Giriş Yap' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
        
        <Modal
          visible={showQuestionPicker}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowQuestionPicker(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: themeColors.background }]}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {currentLanguage === 'tr' ? 'Güvenlik Sorusu Seçin' : 'Select Security Question'}
              </Text>
              {securityQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.questionOption, { borderColor: themeColors.border }]}
                  onPress={() => {
                    setSecurityQuestion(question);
                    setShowQuestionPicker(false);
                  }}
                >
                  <Text style={[styles.questionText, { color: themeColors.text }]}>
                    {question}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: themeColors.border }]}
                onPress={() => setShowQuestionPicker(false)}
              >
                <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>
                  {currentLanguage === 'tr' ? 'İptal' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  formContainer: {
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
  registerButton: {
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
  loginButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    height: 45,
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  questionOption: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  questionText: {
    fontSize: 16,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen