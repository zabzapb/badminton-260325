import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

// Parse .env.local
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

async function updateUserRoles() {
  console.log('--- Searching users "민정현" and "이진숙" in Firestore ---');
  
  const playersRef = collection(db, 'players');
  const snapshot = await getDocs(playersRef);
  
  let foundMin = false;
  let foundLee = false;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = data.realName || data.name;

    if (name === '민정현') {
      foundMin = true;
      console.log(`📌 Found 민정현 (ID: ${docSnap.id}): current isManager=${data.isManager}, isMaster=${data.isMaster}`);
      await updateDoc(doc(db, 'players', docSnap.id), {
        isManager: true,
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ 민정현 -> 매니저(isManager: true) 등업 완료!`);
    }

    if (name === '이진숙') {
      foundLee = true;
      console.log(`📌 Found 이진숙 (ID: ${docSnap.id}): current isManager=${data.isManager}, isMaster=${data.isMaster}`);
      await updateDoc(doc(db, 'players', docSnap.id), {
        isManager: false,
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ 이진숙 -> 일반 플레이어(isManager: false) 변경 완료!`);
    }
  }

  if (!foundMin) {
    console.warn('⚠️ 민정현 사용자를 Firestore에서 찾지 못했습니다. (이름 확인 필요)');
  }
  if (!foundLee) {
    console.warn('⚠️ 이진숙 사용자를 Firestore에서 찾지 못했습니다. (이름 확인 필요)');
  }

  process.exit(0);
}

updateUserRoles().catch(err => {
  console.error('❌ Error updating user roles:', err);
  process.exit(1);
});
