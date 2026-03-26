import { addData, getData, queryData, removeData } from "./firestore";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./config";
import { getRandomAvatarByGender } from "../avatar";

import { UserProfile } from "../types";
export type { UserProfile };

const COLLECTION_USERS = "players";

// Helper to generate a non-identifying ID from phone number (simple hash for demo, or could use random string)
export const generateUserUid = (phone: string) => {
  if (!phone) return "temp_" + Math.random().toString(36).substring(7);
  // Simple numeric obfuscation: reverse and replace common separators
  const clean = phone.replace(/[^0-9]/g, "");
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i);
    hash |= 0;
  }
  return "p_" + Math.abs(hash).toString(16).padStart(8, '0');
};

// Validate Korean mobile phone number (010 followed by 8 digits)
export const isValidKoreanMobile = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, "");
    return /^010[0-9]{8}$/.test(clean);
};

export const saveUserProfile = async (profile: UserProfile) => {
  const cleanPhone = profile.phone.replace(/[^0-9]/g, "");
  
  if (!isValidKoreanMobile(cleanPhone)) {
    return { success: false, error: "Invalid phone number format" };
  }

  let uid = profile.id || generateUserUid(cleanPhone);
  
  // ── [Identity Resolution] Attempt to find existing user by phone for auto-merge ──
  // If we're creating a new profile (no id or p_ id), check if another record exists with this phone.
  if (!profile.id || profile.id.startsWith("p_")) {
    try {
      const existingByPhone = await findUserByPhone(cleanPhone);
      if (existingByPhone.success && Array.isArray(existingByPhone.data) && existingByPhone.data.length > 0) {
        // Preference: 1. Exact Name match, 2. Naver account (NV_), 3. Any existing
        const nameMatch = existingByPhone.data.find(u => u.realName === profile.realName);
        const naverMatch = existingByPhone.data.find(u => u.id.startsWith("NV_"));
        uid = (nameMatch?.id) || (naverMatch?.id) || existingByPhone.data[0].id;
      }
    } catch (err) {
      console.warn("Identity resolution lookup failed:", err);
    }
  }

  // ── Existing Data Check to preserve createdAt/avatarUrl ──
  try {
    const existing = await getUserProfile(uid);
    let originalData: any = {};
    if (existing.success && existing.data) {
        originalData = existing.data;
    }

    // Assign random avatar if missing
    let avatarUrl = profile.avatarUrl || originalData.avatarUrl;
    if (!avatarUrl) {
        // Find existing avatars to avoid duplicates
        const allUsers = await getAllUsers();
        const usedAvatars = allUsers.map(u => u.avatarUrl).filter((url): url is string => !!url);
        avatarUrl = getRandomAvatarByGender(profile.gender, usedAvatars);
    }

    const finalData = {
        ...originalData,
        ...profile,
        nickname: profile.nickname ?? originalData.nickname ?? "", // [Fix] Allow empty string, fallback if undefined
        birthDate: profile.birthDate || (profile.birthYear ? `${profile.birthYear}-01-01` : ""),
        avatarUrl: avatarUrl || "", // ensure some string
        avatarChangeCount: profile.avatarChangeCount ?? originalData.avatarChangeCount ?? 0,
        phone: cleanPhone,
        id: uid,
        isVerified: profile.isVerified ?? originalData.isVerified ?? false, 
        isMaster: profile.isMaster ?? originalData.isMaster ?? false,
        isManager: profile.isManager ?? originalData.isManager ?? false,
        updatedAt: new Date().toISOString(),
    };

    // Ensure createdAt exists if not in originalData
    if (!finalData.createdAt) {
        finalData.createdAt = new Date().toISOString();
    }

    return await addData(COLLECTION_USERS, uid, finalData);
  } catch (err) {
    console.error("Error in saveUserProfile update:", err);
    return { success: false, error: "Profile update failed" };
  }
};

export const getUserProfile = async (id: string) => {
  return await getData(COLLECTION_USERS, id);
};

export const findUserByPhone = async (phone: string) => {
  return await queryData(COLLECTION_USERS, "phone", phone);
};

export const getAllUsers = async () => {
    try {
        if (!db) {
            console.warn("Firestore database is not initialized. Attempting local storage fallback.");
            // [Resilience] If Firebase is down, at least show the currently logged-in user from local storage
            const local = localStorage.getItem("hctc_user_profile");
            if (local) {
                try {
                    const parsed = JSON.parse(local);
                    return [parsed] as UserProfile[];
                } catch (e) {
                    return [];
                }
            }
            return [];
        }
        // [수정] Firestore 쿼리에서 직접 정렬 시, createdAt 필드가 없는 문서는 제외되는 문제가 있으므로
        // 일단 전체를 가져온 뒤 메모리에서 정렬함.
        const q = query(collection(db, COLLECTION_USERS));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        })) as UserProfile[];

        return users.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // 최신 등록순
        });
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};

export const deleteUserProfile = async (id: string) => {
  return await removeData(COLLECTION_USERS, id);
};
