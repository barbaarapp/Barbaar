import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, BookingSession, Therapist, Booking, Message, ClientProfile } from '../types';

const firebaseConfig = {
  projectId: 'barbaar-wellness',
  appId: '1:5661712547:web:462a3cb7a3422c354b5f16',
  apiKey: 'AIzaSyAuNwMZnt7iiV89vmTFJys8PECfx-US0j8',
  authDomain: 'login.barbaar.org',
  storageBucket: 'barbaar-wellness.firebasestorage.app',
  messagingSenderId: '5661712547',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = initializeFirestore(
  app,
  { ignoreUndefinedProperties: true },
  'ai-studio-barbaarwellness-541cbec8-9a49-4121-ae3a-f55ecbb29e77'
);

export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
};

const STORAGE_KEYS = {
  USER_PROFILE: 'barbaar_user_profile',
  ACTIVE_SESSION: 'barbaar_active_session',
  THERAPISTS: 'barbaar_therapists',
  BOOKINGS: 'barbaar_bookings',
  MESSAGES: 'barbaar_messages',
  CLIENT_PROFILE: 'barbaar_client_profile',
};

export const nativeStorageService = {
  saveUserProfile: async (profile: UserProfile): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving profile to AsyncStorage:', error);
    }
  },

  getUserProfile: async (): Promise<UserProfile | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading profile from AsyncStorage:', error);
      return null;
    }
  },

  saveClientProfile: async (profile: ClientProfile): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CLIENT_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving client profile:', error);
    }
  },

  getClientProfile: async (): Promise<ClientProfile | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CLIENT_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading client profile:', error);
      return null;
    }
  },

  saveActiveSession: async (session: BookingSession): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving active session:', error);
    }
  },

  getActiveSession: async (): Promise<BookingSession | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading active session:', error);
      return null;
    }
  },

  clearSessionData: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER_PROFILE, STORAGE_KEYS.ACTIVE_SESSION]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
