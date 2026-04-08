
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const config = {};
envContent.split("\n").forEach(line => {
    const parts = line.split("=");
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
        if (key) config[key] = val;
    }
});

const firebaseConfig = {
    apiKey: config.VITE_FIREBASE_API_KEY,
    authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: config.VITE_FIREBASE_PROJECT_ID,
    storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: config.VITE_FIREBASE_APP_ID,
    measurementId: config.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectTournament(id) {
    const docRef = doc(db, "tournaments", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        console.log(JSON.stringify(docSnap.data(), null, 2));
    } else {
        console.log("No such tournament!");
    }
}

inspectTournament("t-1774502487427");
