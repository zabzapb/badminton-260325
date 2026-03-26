import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");

// Simple .env.local parser
function getEnv() {
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};
  content.split("\n").forEach(line => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length > 0) {
      env[key.trim()] = rest.join("=").trim().replace(/"/g, "");
    }
  });
  return env;
}

const env = getEnv();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

console.log("🚀 Initializing Cleanup for Project:", env.VITE_FIREBASE_PROJECT_ID);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function purgeCollection(collectionName) {
  console.log(`📡 Fetching ${collectionName}...`);
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  
  if (snapshot.empty) {
    console.log(`✅ ${collectionName} is already empty.`);
    return;
  }

  console.log(`🔥 Deleting ${snapshot.size} documents from ${collectionName}...`);
  const deletions = snapshot.docs.map(d => deleteDoc(doc(db, collectionName, d.id)));
  await Promise.all(deletions);
  console.log(`✅ Purged ${collectionName}.`);
}

async function run() {
  try {
    // 1. Delete all users
    await purgeCollection("users");
    
    // 2. Delete all tournament applications
    await purgeCollection("tournamentApplications");
    
    console.log("\n✨ DATABASE CLEANUP SUCCESSFUL ✨");
    console.log("Tournament configurations were preserved as requested.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
}

run();
