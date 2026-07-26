import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';

const envContent = fs.readFileSync('c:/Users/CHW/Desktop/HCTCplayer/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length > 0) {
    env[key.trim()] = vals.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

const firebaseConfig1 = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: "hctcplayer.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('Testing Bucket 1: hctcplayer.appspot.com');
const app1 = initializeApp(firebaseConfig1, "app1");
const storage1 = getStorage(app1);

async function testUpload() {
  try {
    const dummyBuffer = Buffer.from('test image content');
    const storageRef = ref(storage1, `test/test_${Date.now()}.txt`);
    console.log('Attempting uploadBytes to path:', storageRef.fullPath);
    const snapshot = await uploadBytes(storageRef, dummyBuffer);
    console.log('✅ Upload success! Snapshot path:', snapshot.metadata.fullPath);
    const url = await getDownloadURL(snapshot.ref);
    console.log('✅ Download URL:', url);
  } catch (error) {
    console.error('❌ Storage Test Error (appspot.com):', error.code, error.message);
  }
  process.exit(0);
}

testUpload();
