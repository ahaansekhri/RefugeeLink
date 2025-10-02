import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, collection } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAvcVJtPB0ZENCQ-YBaGC5DaHbp4HItXrs",
  authDomain: "refugeelink-5a40f.firebaseapp.com",
  projectId: "refugeelink-5a40f",
  storageBucket: "refugeelink-5a40f.firebasestorage.app",
  messagingSenderId: "525573858519",
  appId: "1:525573858519:web:2bd650487b9ed2ae4cfc92"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Use correct auth initialization based on platform
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app); // Use standard web auth
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };

export const db = getFirestore(app);
export const storage = getStorage(app);
export const usersRef = collection(db, 'users');
