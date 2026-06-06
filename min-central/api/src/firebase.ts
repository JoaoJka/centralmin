import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
};

export const firebaseApp = initializeApp({
  apiKey: requiredEnv('FIREBASE_API_KEY'),
  authDomain: requiredEnv('FIREBASE_AUTH_DOMAIN'),
  databaseURL: requiredEnv('FIREBASE_DATABASE_URL'),
  projectId: requiredEnv('FIREBASE_PROJECT_ID'),
  storageBucket: requiredEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requiredEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: requiredEnv('FIREBASE_APP_ID'),
});

export const db = getDatabase(firebaseApp);
