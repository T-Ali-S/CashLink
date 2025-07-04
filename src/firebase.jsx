import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";



const firebaseConfig = {
  apiKey: "AIzaSyCmfRhK3_wsWBWJnP7Gy7eXaIL5woc7yzU",
  authDomain: "cashlink-b1630.firebaseapp.com",
  projectId: "cashlink-b1630",
  storageBucket: "cashlink-b1630.appspot.com",
  messagingSenderId: "435351272655",
  appId: "1:435351272655:web:c330e015eb6e83460fcbba",
  measurementId: "G-0642H4H1CK",
  databaseURL: "https://cashlink-b1630-default-rtdb.firebaseio.com"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
