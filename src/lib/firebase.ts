import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "studio-1052878063-3a28a",
  "appId": "1:813623161084:web:700c033da623462814e779",
  "apiKey": "AIzaSyAbuwT8eOJ4MJUQ6iEZQyDUrIHyBG4Qs1w",
  "authDomain": "studio-1052878063-3a28a.firebaseapp.com",
  "storageBucket": "studio-1052878063-3a28a.appspot.com",
  "messagingSenderId": "813623161084",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = firebaseConfig.appId;

export { app, auth, db, appId };
