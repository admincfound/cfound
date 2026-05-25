import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Create a safe, structured copy of your JSON config
const updatedFirebaseConfig: FirebaseOptions & { firestoreDatabaseId?: string } = { ...firebaseConfig };

/**
 * ⚡ FIX: Chrome Bounce Tracking & Environment Alignment
 * Ensure the config object retains all original fields while rewriting the auth domain cleanly.
 */
if (typeof window !== 'undefined') {
  const currentHostname = window.location.hostname;
  
  // If running inside the live production domain
  if (currentHostname.includes('cfound.in') || currentHostname.includes('vercel.app')) {
    updatedFirebaseConfig.authDomain = 'cfound.in'; 
  } else if (currentHostname.includes('run.app')) {
    // Fallback alignment for clean container routing
    updatedFirebaseConfig.authDomain = 'gen-lang-client-0509516374.firebaseapp.com';
  }
}

// Pass the fully verified config object
const app = initializeApp(updatedFirebaseConfig);

export const db = initializeFirestore(app, {
  databaseId: updatedFirebaseConfig.firestoreDatabaseId,
  experimentalForceLongPolling: true, // Prevents hanging connections over strict cloud proxies
});

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});