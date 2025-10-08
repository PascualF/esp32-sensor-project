import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import 'dotenv/config';

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: process.env.URL_KEY,
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };