import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Create a copy of the config so we don't mutate the imported JSON directly
const updatedFirebaseConfig = { ...firebaseConfig };

/**
 * ⚡ FIX: Chrome Bounce Tracking Mitigation Bypass
 * If the app is running on your live production domains (cfound.in or Vercel),
 * we rewrite the authDomain to use your primary domain. 
 * This stops Chrome from treating the login redirect as an external tracking cookie swap.
 */
if (typeof window !== 'undefined') {
  const currentHostname = window.location.hostname;
  
  if (currentHostname.includes('cfound.in') || currentHostname.includes('vercel.app')) {
    // Uses your own clean domain instead of gen-lang-client-0509516374.firebaseapp.com
    updatedFirebaseConfig.authDomain = 'cfound.in'; 
  }
}

const app = initializeApp(updatedFirebaseConfig);

export const db = initializeFirestore(app, {
  databaseId: updatedFirebaseConfig.firestoreDatabaseId,
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
// Forces Google to always show the account selection panel smoothly
googleProvider.setCustomParameters({
  prompt: 'select_account'
});