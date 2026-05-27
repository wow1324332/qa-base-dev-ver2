import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATKKSrUm6NKATdZdJeDxhQ5Dj2Q32ujh0",
  authDomain: "q-base-dev.firebaseapp.com",
  projectId: "q-base-dev",
  storageBucket: "q-base-dev.firebasestorage.app",
  messagingSenderId: "756427289812",
  appId: "1:756427289812:web:217c6ebb1bfbd1d931f741"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
