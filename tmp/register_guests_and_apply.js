
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
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
    if (!phone) return "temp_" + Math.random().toString(36).substring(7);
    const clean = phone.replace(/[^0-9]/g, "");
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
        hash = ((hash << 5) - hash) + clean.charCodeAt(i);
        hash |= 0;
    }
    return "p_" + Math.abs(hash).toString(16).padStart(8, '0');
};

const getCategoryCode = (cat) => {
    switch (cat) {
        case "남복": return "MD";
        case "여복": return "WD";
        case "혼복": return "XD";
        case "단식": return "S";
        default: return cat;
    }
};

const TOURNAMENT_ID = "t-1774502487427";

const playerList = [
    { name: "박효동", gender: "M", birth: "1981-03-17", phone: "010-8532-0272", club: "한콕두콕" },
    { name: "홍기환", gender: "M", birth: "1981-01-28", phone: "010-9107-0798", club: "한콕두콕" },
    { name: "홍승재", gender: "M", birth: "1979-08-31", phone: "010-9427-3082", club: "한콕두콕" },
    { name: "공귀도", gender: "M", birth: "1981-07-12", phone: "010-2832-3497", club: "한콕두콕" },
    { name: "김수향", gender: "F", birth: "1979-12-05", phone: "010-8574-6471", club: "한콕두콕" },
    { name: "임화영", gender: "F", birth: "1986-08-12", phone: "010-7740-0272", club: "한콕두콕" },
    { name: "최호진", gender: "M", birth: "1970-02-11", phone: "010-5382-0082", club: "한콕두콕" },
    { name: "조남희", gender: "F", birth: "1973-08-03", phone: "010-5910-6734", club: "한콕두콕" },
    { name: "윤철성", gender: "M", birth: "1987-07-17", phone: "010-9131-3871", club: "한콕두콕" },
    { name: "윤도여", gender: "M", birth: "1990-01-26", phone: "010-4748-3871", club: "한콕두콕" },
];

const pairs = [
    { cat: "남복", group: "45 B", p1: "010-8532-0272", p2: "010-9107-0798" },
    { cat: "남복", group: "45 S", p1: "010-9427-3082", p2: "010-2832-3497" },
    { cat: "여복", group: "40 C", p1: "010-8574-6471", p2: "010-7740-0272" },
    { cat: "혼복", group: "50 C", p1: "010-5382-0082", p2: "010-5910-6734" },
    { cat: "남복", group: "30 D", p1: "010-9131-3871", p2: "010-4748-3871" },
];

async function run() {
    const tournamentSnap = await getDoc(doc(db, "tournaments", TOURNAMENT_ID));
    if (!tournamentSnap.exists()) {
        console.error("Tournament not found");
        return;
    }
    const tournament = tournamentSnap.data();
    const ageGroups = tournament.ageGroups;

    // 1. Register players
    const phoneToProfile = {};
    for (const p of playerList) {
        const cleanPhone = p.phone.replace(/-/g, "");
        const uid = generateUserUid(cleanPhone);
        
        // Check if exists
        const userSnap = await getDoc(doc(db, "players", uid));
        let profile;
        if (userSnap.exists()) {
            profile = userSnap.data();
            console.log(`Player ${p.name} (${cleanPhone}) already exists.`);
        } else {
            profile = {
                id: uid,
                realName: p.name,
                nickname: "",
                phone: cleanPhone,
                gender: p.gender,
                birthDate: p.birth,
                birthYear: parseInt(p.birth.split("-")[0]),
                level: "D", // Default
                club: p.club,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + p.name + "&gender=" + (p.gender === "M" ? "male" : "female"),
                isVerified: false,
                isMaster: false,
                isManager: false,
                referrer: "Guest Registration"
            };
            await setDoc(doc(db, "players", uid), profile);
            console.log(`Registered player ${p.name} (${cleanPhone})`);
        }
        phoneToProfile[cleanPhone] = profile;
    }

    // 2. Apply for tournament
    for (const pair of pairs) {
        const p1Phone = pair.p1.replace(/-/g, "");
        const p2Phone = pair.p2.replace(/-/g, "");
        const profile1 = phoneToProfile[p1Phone];
        const profile2 = phoneToProfile[p2Phone];

        const catCode = getCategoryCode(pair.cat);
        const ageAlias = pair.group.split(" ")[0];
        const grade = pair.group.split(" ")[1];
        const ageGroup = ageGroups.find(g => g.alias === ageAlias) || { id: "ag-" + ageAlias };
        
        const groupSuffix = `${ageAlias}${grade}`.replace(/\s+/g, '');
        const appId = `${TOURNAMENT_ID}_${p1Phone}_${catCode}_${groupSuffix}`;

        const application = {
            id: appId,
            tournamentId: TOURNAMENT_ID,
            userId: p1Phone,
            category: pair.cat,
            group: pair.group,
            ageGroupId: ageGroup.id,
            tournamentBaseYear: tournament.baseYear || 2026,
            appliedAge: (tournament.baseYear || 2026) - profile1.birthYear,
            appliedGrade: grade,
            partnerId: p2Phone,
            partnerInfo: {
                id: profile2.id,
                realName: profile2.realName,
                phone: p2Phone,
                gender: profile2.gender,
                level: grade,
                birthYear: profile2.birthYear,
                club: profile2.club
            },
            applicantInfo: {
                id: profile1.id,
                realName: profile1.realName,
                phone: p1Phone,
                gender: profile1.gender,
                level: grade,
                birthYear: profile1.birthYear,
                club: profile1.club
            },
            status: "confirmed", // Since it's admin/bot registration
            paymentStatus: "confirmed", // Assuming guest registration implies it's okay
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, "applications", appId), application);
        console.log(`Applied: ${pair.cat} ${pair.group} - ${profile1.realName} & ${profile2.realName}`);
    }

    console.log("All done!");
}

run();
