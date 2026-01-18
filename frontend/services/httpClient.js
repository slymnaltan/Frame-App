import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
const httpClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 20000,
});

httpClient.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default httpClient;

