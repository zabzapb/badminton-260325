import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

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

const TO_KEEP = ['t-1774502487427', 't-1774502582562']; // 마포구, 서울시

async function deleteTestApplications() {
  console.log('--- Deleting Test Applications (Not in Mapo/Seoul City) ---');
  try {
    const qSnapshot = await getDocs(collection(db, 'applications'));
    let deleteCount = 0;

    for (const docSnap of qSnapshot.docs) {
      const data = docSnap.data();
      const tid = data.tournamentId;

      if (!TO_KEEP.includes(tid)) {
        console.log(`🗑️ Deleting application: ${docSnap.id} (Tournament: ${data.tournamentName || tid})`);
        await deleteDoc(doc(db, 'applications', docSnap.id));
        deleteCount++;
      }
    }

    console.log(`\n✅ Total applications deleted: ${deleteCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteTestApplications();
