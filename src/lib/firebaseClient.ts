import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;

export function hasFirebaseClientConfig(): boolean {
  return requiredKeys.every((key) => Boolean(firebaseConfig[key]));
}

export function getFirebaseClientApp(): FirebaseApp {
  if (!hasFirebaseClientConfig()) {
    throw new Error('Firebase client config is incomplete. Check NEXT_PUBLIC_FIREBASE_* environment variables.');
  }

  return getApps()[0] ?? initializeApp(firebaseConfig);
}

export function getFirebaseClientAuth(): Auth {
  return getAuth(getFirebaseClientApp());
}

export function getFirebaseClientFirestore(): Firestore {
  return getFirestore(getFirebaseClientApp());
}

export function getFirebaseClientStorage(): FirebaseStorage {
  return getStorage(getFirebaseClientApp());
}
