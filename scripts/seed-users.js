const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");
const fs = require("fs");
const path = require("path");

// Manually parse .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const [key, ...value] = line.split("=");
  if (key && value) {
    env[key.trim()] = value.join("=").trim();
  }
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const users = [
  { id: "010-1000-0001", realName: "홍길동", nickname: "길동무", gender: "M", birthYear: 1990, level: "A", club: "마포클럽", phone: "010-1000-0001", tshirtGender: "남성", tshirtSize: "XL", avatarUrl: "/avatars/avator_m_001.jpg", isVerified: true, createdAt: new Date().toISOString() },
  { id: "010-1000-0002", realName: "성춘향", nickname: "춘향이", gender: "F", birthYear: 1992, level: "B", club: "남원클럽", phone: "010-1000-0002", tshirtGender: "여성", tshirtSize: "M", avatarUrl: "/avatars/avator_f_001.jpg", isVerified: true, createdAt: new Date().toISOString() },
  { id: "010-1000-0003", realName: "이몽룡", nickname: "몽룡이", gender: "M", birthYear: 1989, level: "S", club: "마포클럽", phone: "010-1000-0003", tshirtGender: "남성", tshirtSize: "L", avatarUrl: "/avatars/avator_m_002.jpg", isVerified: true, createdAt: new Date().toISOString() },
  { id: "010-1000-0004", realName: "임꺽정", nickname: "꺽정군", gender: "M", birthYear: 1985, level: "C", club: "한콕클럽", phone: "010-1000-0004", tshirtGender: "남성", tshirtSize: "XXL", avatarUrl: "/avatars/avator_m_003.jpg", isVerified: true, createdAt: new Date().toISOString() },
  { id: "010-1000-0005", realName: "심청", nickname: "효녀", gender: "F", birthYear: 1995, level: "D", club: "바다클럽", phone: "010-1000-0005", tshirtGender: "여성", tshirtSize: "S", avatarUrl: "/avatars/avator_f_002.jpg", isVerified: true, createdAt: new Date().toISOString() },
  { id: "010-1000-0006", realName: "놀부", nickname: "욕심쟁이", gender: "M", birthYear: 1978, level: "B", club: "흥부네", phone: "010-1000-0006", tshirtGender: "남성", tshirtSize: "L", avatarUrl: "/avatars/avator_m_004.jpg", isVerified: true, createdAt: new Date().toISOString() },
  { id: "010-1000-0007", realName: "흥부", nickname: "착한흥부", gender: "M", birthYear: 1982, level: "D", club: "흥부네", phone: "010-1000-0007", tshirtGender: "남성", tshirtSize: "M", avatarUrl: "/avatars/avator_m_005.jpg", isVerified: true, createdAt: new Date().toISOString() },
  { id: "010-1000-0008", realName: "장화", nickname: "언니", gender: "F", birthYear: 1991, level: "C", club: "장화홍련", phone: "010-1000-0008", tshirtGender: "여성", tshirtSize: "M", avatarUrl: "/avatars/avator_f_003.jpg", isVerified: true, createdAt: new Date().toISOString() },
  { id: "010-1000-0009", realName: "홍련", nickname: "동생", gender: "F", birthYear: 1993, level: "A", club: "장화홍련", phone: "010-1000-0009", tshirtGender: "여성", tshirtSize: "S", avatarUrl: "/avatars/avator_f_004.jpg", isVerified: true, createdAt: new Date().toISOString() },
  { id: "010-1000-0010", realName: "전우치", nickname: "도사", gender: "M", birthYear: 1987, level: "S", club: "태백산", phone: "010-1000-0010", tshirtGender: "남성", tshirtSize: "L", avatarUrl: "/avatars/avator_m_006.jpg", isVerified: true, createdAt: new Date().toISOString() },
];

async function seed() {
  console.log("Seeding users...");
  try {
    for (const user of users) {
      await setDoc(doc(db, "users", user.id), user);
      console.log(`Added user: ${user.realName}`);
    }
    console.log("Done!");
  } catch (err) {
    console.error("Full error record:", JSON.stringify(err, null, 2));
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
  }
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
