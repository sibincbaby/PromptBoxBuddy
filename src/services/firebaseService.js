// Firebase service for authentication and other Firebase features
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA06Bto7XGhJKwprx9pf7uGDHfefzINQjQ",
  authDomain: "promptbox-3fe87.firebaseapp.com",
  projectId: "promptbox-3fe87",
  storageBucket: "promptbox-3fe87.firebasestorage.app",
  messagingSenderId: "647633571093",
  appId: "1:647633571093:web:288fd3e079a56387616d1c",
  measurementId: "G-MYRZBCNV8V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Google authentication provider
const googleProvider = new GoogleAuthProvider();

// Set custom parameters for better UX
googleProvider.setCustomParameters({
  // This will make Google display your app name as "PromptBoxBuddy" instead of the domain
  'app_name': 'PromptBox'
});

// Firebase authentication service
export { 
  app,     // Firebase app instance
  auth,    // Firebase auth instance
  analytics, // Firebase analytics instance
  googleProvider  // Google authentication provider
};

// Helper functions for authentication
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // This gives you a Google Access Token which can be used to access the Google API
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    
    // Get user information
    const user = result.user;
    
    // Get JWT token for backend authentication
    const idToken = await user.getIdToken();
    
    return {
      user,
      idToken,
      token
    };
  } catch (error) {
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

export const getIdToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
  if (user) {
    try {
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      throw error;
    }
  }
  return null;
};