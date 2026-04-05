import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
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

async function findApplications() {
  console.log('--- Searching for applications mentioning 남정강 or 김정석 ---');
  try {
    const q = query(collection(db, 'applications'));
    const snapshot = await getDocs(q);
    
    const results = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      
      const appRealName = data.applicantInfo?.realName || data.userName || data.userRealName;
      const partnerRealName = data.partnerInfo?.realName || data.partnerName || data.partnerRealName;
      
      const hasNam = (appRealName && appRealName.includes('남정강')) || (partnerRealName && partnerRealName.includes('남정강'));
      const hasKim = (appRealName && appRealName.includes('김정석')) || (partnerRealName && partnerRealName.includes('김정석'));
      
      if (hasNam || hasKim) {
        results.push({
          id: docSnap.id,
          applicant: appRealName,
          partner: partnerRealName,
          userId: data.userId,
          partnerId: data.partnerId,
          category: data.category,
          group: data.group,
          status: data.status,
          paymentStatus: data.paymentStatus,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      }
    });
    
    // Sort by createdAt
    results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findApplications();
