import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import SplashScreen from '../screens/SplashScreen'; 

export default function RootNavigator() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 2400); // 2.4 saniye splash gösterir

    return () => clearTimeout(timer); 
  }, []);

  if (isSplashVisible) {
    return <SplashScreen />;
  }

  return token ? <TabNavigator /> : <AuthNavigator />;
}