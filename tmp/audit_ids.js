import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

function identifyType(id) {
  if (!id) return 'missing';
  if (id.startsWith('NV_')) return 'Naver-UID';
  if (id.startsWith('p_')) return 'Guest-ID';
  if (/^010\d{8}$/.test(id)) return 'Phone-ID';
  return 'Unknown';
}

async function auditApplications() {
  console.log('--- Auditing All Tournament Applications ---');
  try {
    const qSnapshot = await getDocs(collection(db, 'applications'));
    
    const stats = {
      total: 0,
      bothPhone: 0,
      bothNaver: 0,
      mixedPhoneNaver: 0,
      hasGuest: 0,
      other: 0,
      statusGroups: {}
    };

    const details = [];

    qSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'cancelled' || data.status === 'rejected') return;

      stats.total++;
      const uType = identifyType(data.userId);
      const pType = identifyType(data.partnerId);

      const appName = data.applicantInfo?.realName || data.userName || 'Unknown';
      const partnerName = data.partnerInfo?.realName || data.partnerName || 'N/A';

      if (uType === 'Phone-ID' && pType === 'Phone-ID') stats.bothPhone++;
      else if (uType === 'Naver-UID' && pType === 'Naver-UID') stats.bothNaver++;
      else if ((uType === 'Phone-ID' && pType === 'Naver-UID') || (uType === 'Naver-UID' && pType === 'Phone-ID')) stats.mixedPhoneNaver++;
      else if (uType === 'Guest-ID' || pType === 'Guest-ID') stats.hasGuest++;
      else stats.other++;

      if (uType !== pType && uType !== 'missing' && pType !== 'missing' && pType !== 'Guest-ID') {
          details.push({
              id: docSnap.id,
              names: `${appName} & ${partnerName}`,
              userId: `${data.userId} (${uType})`,
              partnerId: `${data.partnerId} (${pType})`,
              category: `${data.category} ${data.group || ''}`,
              status: data.status
          });
      }
    });

    console.log('\n--- Summary statistics ---');
    console.log(JSON.stringify(stats, null, 2));

    if (details.length > 0) {
        console.log('\n--- Mixed ID System Applications (Potential Risks) ---');
        console.log(JSON.stringify(details, null, 2));
    } else {
        console.log('\nNo mixed ID system applications found among active ones.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

auditApplications();
