import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, collection, getDocs } from 'firebase/firestore';
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

// Data pool for avatars
const TOTAL_FEMALE_AVATARS = 57;

function getRandomFemaleAvatar() {
  const index = Math.floor(Math.random() * TOTAL_FEMALE_AVATARS) + 1;
  return `/avatars/avator_w_${String(index).padStart(3, "0")}.jpg`;
}

// Targeted users (from previous successful IDs)
const usersToFix = [
  { id: 'NV_QXy2AabkWfZ5Cf1Cnxkke5DAWh6W1zlkA7OpxoTzRbE', name: '조지혜' },
  { id: 'NV_9OhF5z5dPVZ4DyzFOF0NdqLKlbJu5kk6jSZcdvIaWdk', name: '이진숙' },
  { id: 'NV_ssFCvx3z2f_oH9VzYQh3Ewmf9k1R80EkhFobOAIZZwc', name: '김선화' }
];

async function fixFemaleAvatars() {
  console.log('--- Randomizing avatars for 3 female users (fixed gender) ---');
  for (const user of usersToFix) {
    try {
      const avatarUrl = getRandomFemaleAvatar();
      const docRef = doc(db, 'players', user.id);
      await updateDoc(docRef, {
        avatarUrl: avatarUrl,
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ Fixed: ${user.name} -> New Avatar: ${avatarUrl}`);
    } catch (error) {
      console.error(`❌ Failed: ${user.name}`, error);
    }
  }
  process.exit(0);
}

fixFemaleAvatars();
