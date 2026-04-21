// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYWOZgyKWSdokPrFhiZmzmf73YuwKg43k",
  authDomain: "gamesage-lsu.firebaseapp.com",
  databaseURL: "https://gamesage-lsu-default-rtdb.firebaseio.com",
  projectId: "gamesage-lsu",
  storageBucket: "gamesage-lsu.firebasestorage.app",
  messagingSenderId: "626081120815",
  appId: "1:626081120815:web:30bb3f0731e8f5e3757cda"
};

// Initialize Firebase — guard against duplicate-app errors during hot reload
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);