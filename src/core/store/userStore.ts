/**
 * Core User Store
 * Manages atomic Player state and IndexedDB persistence.
 */

import { create } from 'zustand';
import { UserProfile } from "@/lib/types";

interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  setProfile: (profile: UserProfile | null) => void;
  persistProfile: (profile: UserProfile) => Promise<void>;
  clearProfile: () => void;
}

const DB_NAME = 'hctc_user_db';
const STORE_NAME = 'user_profile';

/**
 * Zustand store with explicit Persistence Layer using IndexedDB native API.
 */
export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isAuthenticated: false,

  setProfile: (profile) => set({ profile, isAuthenticated: !!profile }),

  persistProfile: async (profile) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(profile, 'current');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
      request.onerror = () => reject(request.error);
    });
  },

  clearProfile: () => {
    set({ profile: null, isAuthenticated: false });
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete('current');
        tx.oncomplete = () => db.close();
    };
  }
}));

/**
 * Initial load from IndexedDB on app startup.
 */
export async function initializeUserFromDB() {
    return new Promise<void>((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(STORE_NAME, 'readonly');
            const getRequest = tx.objectStore(STORE_NAME).get('current');
            getRequest.onsuccess = () => {
                if (getRequest.result) {
                    useUserStore.getState().setProfile(getRequest.result);
                }
                db.close();
                resolve();
            };
            getRequest.onerror = () => {
                db.close();
                resolve();
            };
        };
    });
}
