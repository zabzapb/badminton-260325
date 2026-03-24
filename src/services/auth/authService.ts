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

    // 1. [Identity Management] Ensure Provider-based Unique ID (NV_xxx)
    const providerId = profile.id.startsWith('NV_') ? profile.id : `NV_${profile.id}`;
    
    // 2. [Upsert] Load existing profile or prepare new one
    const existing = await getData('players', providerId);
    const existingData = existing.success ? (existing.data as any) : {};
    
    // [Check] Consider new user if non-existent or level/tshirt missing
    const isNewUser = !existing.success || !existingData.level;
    
    const now = new Date().toISOString();
    const finalProfile: UserProfile = {
      ...existingData,
      ...profile,
      id: providerId,
      createdAt: existingData.createdAt || now,
      updatedAt: now,
      lastLoginAt: now,
    };

    // 3. [Firestore Write] Sync to Real DB
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
    
    // 5. Dashboard Refresh
    await loadDashboard();

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
