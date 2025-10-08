import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCtYP6lSamcR3cKvMORkTVaPNJ-cOwi5Gc",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://esp32sensorsproject-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };