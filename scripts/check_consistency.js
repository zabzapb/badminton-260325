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

async function checkDataConsistency() {
  console.log('--- Checking Database Consistency ---');
  try {
    const querySnapshot = await getDocs(collection(db, 'players'));
    let malformedCount = 0;
    let total = 0;
    
    querySnapshot.forEach((docSnap) => {
      total++;
      const data = docSnap.data();
      const issues = [];
      
      if (!data.realName || data.realName.trim() === '') issues.push('Missing Name');
      if (!data.phone || data.phone.trim() === '') issues.push('Missing Phone');
      if (!data.gender) issues.push('Missing Gender');
      if (!data.birthYear && !data.birthDate) issues.push('Missing Birth Info');
      
      if (issues.length > 0) {
        console.log(`⚠️ Malformed: ${docSnap.id} | Name: ${data.realName || 'N/A'} | Issues: ${issues.join(', ')}`);
        malformedCount++;
      }
    });
    
    console.log(`\nTotal checked: ${total}`);
    console.log(`Malformed found: ${malformedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDataConsistency();
