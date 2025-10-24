
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA0AhLhqFF_tujxdJL0ENfrh27VuWfFKas",
  authDomain: "centrocommercialenatural-697d6.firebaseapp.com",
  projectId: "centrocommercialenatural-697d6",
  storageBucket: "centrocommercialenatural-697d6.appspot.com",
  messagingSenderId: "58509881845",
  appId: "1:58509881845:web:3a85fe6aaf062e4af6b0bc",
  measurementId: "G-6QQ926DZL0"
};

// Evita la doppia inizializzazione
// FIX: Use v8 compatibility syntax for Firebase initialization
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

export { db, auth };
