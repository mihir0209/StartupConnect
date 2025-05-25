import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyATblEu3tev8Gu5t7LMhXQQ7XKP2qs-2H8",
  authDomain: "linkedin-clone-pro-yash.firebaseapp.com",
  projectId: "linkedin-clone-pro-yash",
  storageBucket: "linkedin-clone-pro-yash.firebasestorage.app",
  messagingSenderId: "459735764566",
  appId: "1:459735764566:web:038979818e924ae457f5f7",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Optional: Set persistence to local to keep users signed in across browser sessions
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Firebase persistence error:", error);
  });


export { app, auth, db, googleProvider };
