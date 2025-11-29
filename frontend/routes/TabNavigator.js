import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { themes } from '../utils/themes';
import { translations } from '../utils/translations';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import PaymentWebViewScreen from '../screens/PaymentWebViewScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  const currentTheme = useSelector(state => state.theme.theme);
  const currentLanguage = useSelector(state => state.language.language);

  const t = translations[currentLanguage];
  const themeColors = themes[currentTheme];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Activities') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.secondaryText,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: 'bold',
          marginBottom: 2,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        options={{
          title: currentLanguage === 'tr' ? 'Anasayfa' : 'Dashboard'
        }}
        component={HomeScreen}
      />
      <Tab.Screen
        name="Activities"
        options={{
          title: currentLanguage === 'tr' ? 'Etkinlikler' : 'Activities'
        }}
        component={ActivitiesScreen}
      />
      <Tab.Screen
        name="Profile"
        options={{
          title: currentLanguage === 'tr' ? 'Profil' : 'Profile'
        }}
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}

export default function TabNavigator() {
  const currentTheme = useSelector(state => state.theme.theme);
  const currentLanguage = useSelector(state => state.language.language);
  const themeColors = themes[currentTheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={["top", "bottom"]}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: themeColors.card,
          },
          headerTintColor: themeColors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateEvent"
          component={CreateEventScreen}
          options={{
            title: currentLanguage === 'tr' ? 'Yeni Etkinlik' : 'New Event',
            headerBackTitle: currentLanguage === 'tr' ? 'Geri' : 'Back',
          }}
        />
        <Stack.Screen
          name="PaymentWebView"
          component={PaymentWebViewScreen}
          options={{
            title: currentLanguage === 'tr' ? 'Ödeme' : 'Payment',
            headerBackTitle: currentLanguage === 'tr' ? 'Geri' : 'Back',
          }}
        />
      </Stack.Navigator>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
