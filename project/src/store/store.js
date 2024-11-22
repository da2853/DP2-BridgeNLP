import { create } from "zustand";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function setInitialApp() {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    return getAuth(app);
  } else {
    return getAuth(); 
  }
}

const useStore = create((set) => ({
  isAuthenticated: false,
  initializeApp: false,
  auth: null,

  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setInitializeApp: () => set({ initializeApp: true, auth: setInitialApp() }),
}));


export { useStore };