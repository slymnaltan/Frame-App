import React, { useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import RootNavigator from "./routes/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {store} from "./redux/store";
import {Provider, useDispatch, useSelector} from "react-redux";
import { themes } from "./utils/themes";
import { loadTheme } from "./redux/slice/themeSlice";
import { loadLanguage } from "./redux/slice/languageSlice";

const AppContent = () => {
  const dispatch = useDispatch();
  const theme = useSelector(state => state.theme.theme);
  const currentTheme = themes[theme];

  useEffect(() => {
    dispatch(loadTheme());
    dispatch(loadLanguage());
  }, [dispatch]);

  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: currentTheme.background,
      card: currentTheme.card,
      text: currentTheme.text,
      primary: currentTheme.primary,
      border: currentTheme.border,
    },
  };

  return (
    <NavigationContainer theme={MyTheme}>
      <RootNavigator/>
    </NavigationContainer>
  );
};

export default function App(){
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </SafeAreaProvider>
  )
}