
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const config = {};
envContent.split("\n").forEach(line => {
    const parts = line.split("=");
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
        if (key) config[key] = val;
    }
});

const firebaseConfig = {
    apiKey: config.VITE_FIREBASE_API_KEY,
    authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: config.VITE_FIREBASE_PROJECT_ID,
    storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: config.VITE_FIREBASE_APP_ID,
    measurementId: config.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const generateUserUid = (phone) => {
    const clean = phone.replace(/[^0-9]/g, "");
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
        hash = ((hash << 5) - hash) + clean.charCodeAt(i);
        hash |= 0;
    }
    return "p_" + Math.abs(hash).toString(16).padStart(8, '0');
};

const GUEST_AVATAR_URL = "/avatars/avator_guest.jpg";
const TOURNAMENT_ID = "t-1774502487427";

const phones = [
    "01085320272", "01091070798", "01094273082", "01028323497",
    "01085746471", "01077400272", "01053820082", "01059106734",
    "01091313871", "01047483871"
];

const appIds = [
    "t-1774502487427_01085320272_MD_45B",
    "t-1774502487427_01094273082_MD_45S",
    "t-1774502487427_01085746471_WD_40C",
    "t-1774502487427_01053820082_XD_50C",
    "t-1774502487427_01091313871_MD_30D"
];

async function updateAvatars() {
    // 1. Update Players
    for (const phone of phones) {
        const uid = generateUserUid(phone);
        try {
            await updateDoc(doc(db, "players", uid), {
                avatarUrl: GUEST_AVATAR_URL,
                updatedAt: new Date().toISOString()
            });
            console.log(`Updated avatar for player ${phone}`);
        } catch (e) {
            console.error(`Failed to update player ${phone}:`, e.message);
        }
    }

    // 2. Update Applications (nested info)
    for (const appId of appIds) {
        try {
            const appSnap = await getDoc(doc(db, "applications", appId));
            if (appSnap.exists()) {
                const appData = appSnap.data();
                const updates = { updatedAt: new Date().toISOString() };
                
                if (appData.applicantInfo) {
                    updates.applicantInfo = { ...appData.applicantInfo, avatarUrl: GUEST_AVATAR_URL };
                }
                if (appData.partnerInfo) {
                    updates.partnerInfo = { ...appData.partnerInfo, avatarUrl: GUEST_AVATAR_URL };
                }
                
                await updateDoc(doc(db, "applications", appId), updates);
                console.log(`Updated avatar in application ${appId}`);
            }
        } catch (e) {
            console.error(`Failed to update application ${appId}:`, e.message);
        }
    }

    console.log("All avatars updated!");
}

updateAvatars();
