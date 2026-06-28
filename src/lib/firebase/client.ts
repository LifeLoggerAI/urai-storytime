import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getStorytimeRuntimeConfig, isPublicSharingReady, isStorytimeCloudCallableReady } from "@/lib/storytime/runtime-config";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let cachedFunctions: Functions | null = null;
let cachedStorage: FirebaseStorage | null = null;

export function getMissingFirebaseClientConfigKeys() {
  return getStorytimeRuntimeConfig().missingFirebaseClientEnv;
}

export function isFirebaseClientConfigured() {
  return getMissingFirebaseClientConfigKeys().length === 0;
}

export function isStorytimeCloudModeEnabled() {
  return isStorytimeCloudCallableReady();
}

export function isStorytimePublicSharingEnabled() {
  return isPublicSharingReady();
}

function assertFirebaseClientConfigured() {
  const missing = getMissingFirebaseClientConfigKeys();
  if (missing.length > 0) {
    throw new Error(`Firebase client config is missing: ${missing.join(", ")}`);
  }
}

export function getFirebaseClientApp(): FirebaseApp {
  assertFirebaseClientConfigured();
  if (!cachedApp) {
    cachedApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return cachedApp;
}

export function getFirebaseAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(getFirebaseClientApp());
  return cachedAuth;
}

export function getFirebaseDb(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(getFirebaseClientApp());
  return cachedDb;
}

export function getFirebaseFunctions(): Functions {
  if (!cachedFunctions) cachedFunctions = getFunctions(getFirebaseClientApp());
  return cachedFunctions;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!cachedStorage) cachedStorage = getStorage(getFirebaseClientApp());
  return cachedStorage;
}

export const firebaseApp = isFirebaseClientConfigured() ? getFirebaseClientApp() : null;
export const auth = firebaseApp ? getFirebaseAuth() : null;
export const db = firebaseApp ? getFirebaseDb() : null;
export const functions = firebaseApp ? getFirebaseFunctions() : null;
export const storage = firebaseApp ? getFirebaseStorage() : null;
