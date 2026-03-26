/**
 * Authentication Service
 * Orchestrates login finalization, server-side sync, identity merge, and traceability.
 */

import { UserProfile } from "@/lib/types";
import { useUserStore } from "@/core/store/userStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { logger } from "@/core/utils/logger";
import { enqueueSyncTask } from "@/core/queue/syncQueue";

import { addData, getData } from "@/lib/firebase/firestore";
import { findUserByPhone } from "@/lib/firebase/userService";

/**
 * Executes post-authentication logic with synchronization and trace logging.
 * Returns success status and whether the user needs to complete their profile.
 */
export async function finalizeLogin(profile: UserProfile): Promise<{ success: boolean; isNewUser: boolean }> {
  const isNaver = profile.id.length > 0;
  const provider = isNaver ? 'NAVER' : 'SOCIAL';
  
  try {
    const { setProfile, persistProfile } = useUserStore.getState();
    const { setProfileLocally, loadDashboard } = useDashboardStore.getState();

    // 1. [Identity Management] Establish Provider ID (NV_xxx)
    const providerId = profile.id.startsWith('NV_') ? profile.id : `NV_${profile.id}`;
    const cleanPhone = profile.phone.replace(/[^0-9]/g, "");
    
    // 2. [Resolution] Search both for direct ID (NV_) and secondary Guest (p_)
    const [idLookup, phoneLookup] = await Promise.all([
      getData('players', providerId),
      findUserByPhone(cleanPhone)
    ]);
    
    let existingData: any = {};
    let guestIdToDelete: string | null = null;
    
    // Priority 1: Existing Naver Account
    if (idLookup.success && idLookup.data) {
      existingData = idLookup.data;
    } 
    
    // Priority 2: Guest Account (Excel Upload)
    if (phoneLookup.success && Array.isArray(phoneLookup.data)) {
      const guest = phoneLookup.data.find((u: any) => u.id.startsWith('p_'));
      if (guest) {
        // [Migration] Combine non-auth fields (level, club, etc.) from guest if not in Naver record
        existingData = { ...guest, ...existingData };
        guestIdToDelete = guest.id;
      }
    }
    
    // [Check] Consider new user if non-existent or level/tshirt missing (missing core preference)
    const isNewUser = (!idLookup.success || !idLookup.data) && (!existingData.level);
    
    const now = new Date().toISOString();
    
    // 3. [Overwrite] Fresh Naver profile (profile) MUST overwrite existing data for identity fields
    const finalProfile: UserProfile = {
      ...existingData,                // Old meta, level, club
      ...profile,                     // Fresh Name, Gender, Phone, Birth (OVERWRITE)
      id: providerId,
      isVerified: true,               // Force verified
      createdAt: existingData.createdAt || now,
      updatedAt: now,
      lastLoginAt: now,
    };

    // 4. [Clean up] Redundant Guest Data
    if (guestIdToDelete && guestIdToDelete !== providerId) {
      const { deleteUserProfile } = await import("@/lib/firebase/userService");
      await deleteUserProfile(guestIdToDelete);
      logger.log('INFO', { event: 'IDENTITY_MERGE', from: guestIdToDelete, to: providerId, phone: cleanPhone });
    }

    // 5. [Firestore Write] Save Verified Record
    const dbResult = await addData('players', providerId, finalProfile);
    
    if (!dbResult.success) {
      logger.authFailed('SYNC_FAILURE', provider, { error: dbResult.error });
      await enqueueSyncTask(finalProfile);
    } else {
      logger.authSuccess(providerId, provider);
    }

    // 4. Persistence & Local Store Sync
    setProfile(finalProfile);
    await persistProfile(finalProfile);
    setProfileLocally(finalProfile);
    localStorage.setItem("hctc_user_profile", JSON.stringify(finalProfile));
    
    // 5. Success (Dashboard will load on its own via useEffect when redirected)
    return { success: true, isNewUser };
  } catch (error) {
    logger.authFailed('AUTH_EXCEPTION', provider, { error });
    return { success: false, isNewUser: false };
  }
}

/**
 * Handles logout and traces the event.
 */
export function logoutUser() {
  const { profile, clearProfile } = useUserStore.getState();
  if (profile) logger.log('INFO', { event: 'LOGOUT', userId: profile.id, status: 'SUCCESS', timestamp: new Date().toISOString() });
  
  clearProfile();
  localStorage.removeItem("hctc_user_profile");
}
