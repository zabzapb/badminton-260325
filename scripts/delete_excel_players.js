import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
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

async function deleteExcelPlayers() {
  console.log('--- Deleting all Excel-uploaded players (starting with "p_") ---');
  try {
    const querySnapshot = await getDocs(collection(db, 'players'));
    let count = 0;
    
    for (const docSnap of querySnapshot.docs) {
      if (docSnap.id.startsWith('p_')) {
        await deleteDoc(doc(db, 'players', docSnap.id));
        console.log(`🗑️ Deleted: ${docSnap.data().realName || 'Unknown'} (${docSnap.id})`);
        count++;
      }
    }
    
    console.log(`\n✅ Total ${count} Excel players deleted.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during deletion:', JSON.stringify(error, null, 2));
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

deleteExcelPlayers();
