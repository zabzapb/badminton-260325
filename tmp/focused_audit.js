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

const TARGET_IDS = ['t-1774502487427', 't-1774502582562']; // 마포구, 서울시

function identifyType(id) {
  if (!id) return 'missing';
  if (id.startsWith('NV_')) return 'Naver-UID';
  if (id.startsWith('p_')) return 'Guest-ID';
  if (/^010\d{8}$/.test(id)) return 'Phone-ID';
  return 'Unknown';
}

async function focusedAudit() {
  console.log('--- Focused Audit: 마포구 & 서울시 ---');
  try {
    const qSnapshot = await getDocs(collection(db, 'applications'));
    
    const results = {
      targetTournaments: {},
      deletionTargets: []
    };

    TARGET_IDS.forEach(tid => {
        results.targetTournaments[tid] = {
            apps: [],
            stats: { total: 0, inconsistent: 0 }
        };
    });

    qSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const tid = data.tournamentId;

      if (TARGET_IDS.includes(tid)) {
        if (data.status === 'cancelled' || data.status === 'rejected') return;

        const uType = identifyType(data.userId);
        const pType = identifyType(data.partnerId);
        
        const isMixed = (uType !== pType && uType !== 'missing' && pType !== 'missing' && pType !== 'Guest-ID');
        
        results.targetTournaments[tid].stats.total++;
        if (isMixed) results.targetTournaments[tid].stats.inconsistent++;
        
        results.targetTournaments[tid].apps.push({
            id: docSnap.id,
            names: `${data.applicantInfo?.realName || data.userName || 'Unknown'} & ${data.partnerInfo?.realName || data.partnerName || 'N/A'}`,
            userId: `${data.userId} (${uType})`,
            partnerId: `${data.partnerId} (${pType})`,
            category: `${data.category || ''} ${data.group || ''}`,
            status: data.status,
            isMixed
        });
      } else {
        if (data.status !== 'cancelled' && data.status !== 'rejected') {
            results.deletionTargets.push({
                id: docSnap.id,
                tournamentName: data.tournamentName || tid, 
                names: `${data.applicantInfo?.realName || data.userName || 'Unknown'} & ${data.partnerInfo?.realName || data.partnerName || 'N/A'}`
            });
        }
      }
    });

    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

focusedAudit();
