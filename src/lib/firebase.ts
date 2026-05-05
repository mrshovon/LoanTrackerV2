import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAwI1Zj29burIY6j8BmdBshfvHfAeEG0nA",
  authDomain: "loantracker-35688.firebaseapp.com",
  databaseURL: "https://loantracker-35688-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "loantracker-35688",
  storageBucket: "loantracker-35688.firebasestorage.app",
  messagingSenderId: "805961828393",
  appId: "1:805961828393:web:49ddfdb7f0521edc0b7438"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
