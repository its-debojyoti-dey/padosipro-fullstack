import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'padosipro_jwt_token';
const USER_KEY = 'padosipro_user_data';

// Default host based on platform: Android emulator uses 10.0.2.2
const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:4000/api/v1',
  default: 'http://localhost:4000/api/v1',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token from SecureStore or localStorage
apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token: string | null = null;
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        token = localStorage.getItem(TOKEN_KEY);
      } else {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Token read error:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export async function storeSession(token: string, user: any): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getStoredSession(): Promise<{ token: string | null; user: any | null }> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      const user = userStr ? JSON.parse(userStr) : null;
      return { token, user };
    }
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const userStr = await SecureStore.getItemAsync(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch (err) {
    console.warn('Error reading stored session:', err);
    return { token: null, user: null };
  }
}

export async function clearSession(): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (err) {
    console.warn('Error clearing session:', err);
  }
}
