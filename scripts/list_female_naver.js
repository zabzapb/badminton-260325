import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Manual .env.local parsing
const envContent = fs.readFileSync('c:/Users/CHW/Desktop/HCTCplayer/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length > 0) {
    env[key.trim()] = vals.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listFemaleNaverUsers() {
  console.log('--- Naver Female Users ---');
  try {
    const querySnapshot = await getDocs(collection(db, 'players'));
    let count = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // List Naver users currently marked as Male
      if (doc.id.startsWith('NV_') && data.gender === 'M') {
        console.log(`- ${data.realName} (${data.phone}) [ID: ${doc.id}]`);
        count++;
      }
    });
    console.log(`\nTotal: ${count} users found.`);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

listFemaleNaverUsers();
