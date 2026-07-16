// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCV2UxUHcimdStfui6aRxSOInJJhLBYgK4",
  authDomain: "stockledger-7b8ec.firebaseapp.com",
  projectId: "stockledger-7b8ec",
  storageBucket: "stockledger-7b8ec.firebasestorage.app",
  messagingSenderId: "574456739117",
  appId: "1:574456739117:web:8180ed355451d9a9534fa4",
  measurementId: "G-NL6TB1504P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);