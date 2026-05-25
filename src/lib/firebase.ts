import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CONNECT TO YOUR NAMED FIRESTORE DATABASE
export const db = initializeFirestore(
  app,
  {},
  'ai-studio-24810410-2d44-4bca-af7d-11572783e2b5'
);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();