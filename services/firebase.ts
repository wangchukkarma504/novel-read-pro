import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyB9_BCuXfVLzbWifelc-c7yV76f5jKO-5w",
  authDomain: "fir-url-85c0f.firebaseapp.com",
  databaseURL: "https://fir-url-85c0f.firebaseio.com",
  projectId: "fir-url-85c0f",
  storageBucket: "fir-url-85c0f.firebasestorage.app",
  messagingSenderId: "913252605833",
  appId: "1:913252605833:web:d720aca05be86986514b58",
  measurementId: "G-N7NFN9EJ3P"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);