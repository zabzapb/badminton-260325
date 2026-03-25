const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

async function listFemaleNaverUsers() {
  const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'service-account.json'), 'utf8'));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();
  const snapshot = await db.collection('players').get();
  
  console.log('--- Naver Female Users ---');
  snapshot.forEach(doc => {
    const data = doc.data();
    if (doc.id.startsWith('NV_') && data.gender === 'F') {
      console.log(`[${doc.id}] Name: ${data.realName}, Phone: ${data.phone}`);
    }
  });
}

listFemaleNaverUsers();
