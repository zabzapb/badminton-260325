import { create } from 'zustand';
import { getAllTournaments } from '@/lib/firebase/tournamentService';
import { getApplicationsByUser, getApplicationsForTournaments, optOutPartner } from '@/lib/firebase/applicationService';
import { getUserProfile } from '@/lib/firebase/userService';
import { getUserNotifications, markNotificationAsRead } from '@/lib/firebase/notificationService';
import { AppNotification } from '@/lib/types';
import { PlayerProfile } from '@/components/ui/PlayerProfileCard/PlayerProfileCard';
import { useUserStore } from '@/core/store/userStore';
import { calculateTournamentStats } from '@/utils/tournamentUtils';

interface DashboardState {
  profile: PlayerProfile | null;
  tournaments: any[];
  notifications: AppNotification[];
  invitations: any[];
  loading: boolean;
  error: string | null;

  loadDashboard: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  leaveTeam: (tournament: any, profile: PlayerProfile) => Promise<boolean>;
  setProfileLocally: (profile: PlayerProfile) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  profile: null,
  tournaments: [],
  notifications: [],
  invitations: [],
  loading: true,
  error: null,

  setProfileLocally: (profile) => set({ profile }),

  loadDashboard: async () => {
    try {
      set({ loading: true, error: null });

      // 1. Local profile
      let currentProfile: PlayerProfile | null = null;
      const cached = localStorage.getItem("hctc_user_profile");
      if (cached) {
        currentProfile = JSON.parse(cached);
        set({ profile: currentProfile });
      }

      // 2. Fetch remote profile if exists
      if (currentProfile?.id) {
        const fbProfile = await getUserProfile(currentProfile.id);
        if (fbProfile.success && fbProfile.data) {
          currentProfile = fbProfile.data as PlayerProfile;
          set({ profile: currentProfile });
          // [Sync] Update primary user store
          useUserStore.getState().setProfile(currentProfile as any);
          localStorage.setItem("hctc_user_profile", JSON.stringify(currentProfile));
        }
      }

      // 3. Fetch tournaments
      const allTournaments = await getAllTournaments() || [];
      const tIds = allTournaments.map((t: any) => t.id);

      // 4. Parallel fetch: User Apps, All Apps for Tournaments, Notifications
      const promises: any[] = [
        tIds.length > 0 ? getApplicationsForTournaments(tIds) : Promise.resolve([])
      ];
      
      if (currentProfile) {
        const phone = currentProfile.phone;
        promises.push(getApplicationsByUser(phone || ""));
        if (currentProfile.id && currentProfile.id !== phone) {
          promises.push(getApplicationsByUser(currentProfile.id));
        } else {
          promises.push(Promise.resolve([])); // dummy
        }
        promises.push(getUserNotifications(phone || currentProfile.id));
      } else {
        promises.push(Promise.resolve([]), Promise.resolve([]), Promise.resolve([]));
      }

      const [allApps, appsByPhone, appsById, notifs] = await Promise.all(promises);

      // Unique user apps
      const userApps = [...appsByPhone, ...appsById];
      const uniqueUserApps = Array.from(new Map(userApps.map(a => [a.id, a])).values());

      // 5. Group Applications & Calc Statistics
      const tMap = new Map();
      allApps.forEach((app: any) => {
        if (!tMap.has(app.tournamentId)) tMap.set(app.tournamentId, []);
        tMap.get(app.tournamentId).push(app);
      });

      const enrichedTournaments = allTournaments.map((t: any) => {
        const tApps = tMap.get(t.id) || [];
        const myApps = uniqueUserApps.filter((app: any) => app.tournamentId === t.id);

        // [통합 통계 유틸 사용]
        const stats = calculateTournamentStats(tApps);

        // Invitations: waiting_partner status & I am the partner
        const currentCleanPhone = currentProfile?.phone?.replace(/[^0-9]/g, "");
        const tInvitations = myApps.filter((app: any) => {
           if (app.status !== "waiting_partner") return false;
           const cleanPartnerP = (app.partnerId || "").replace(/[^0-9]/g, "");
           const isPhoneMatch = cleanPartnerP && currentCleanPhone && cleanPartnerP === currentCleanPhone;
           const isUidMatch = app.partnerId && app.partnerId === currentProfile?.id;
           return isPhoneMatch || isUidMatch;
        });

        // Current User logic
        let isJoined = false;
        let isPartner = false;
        let joinedEvents: any[] = [];
        let appPartnerImages: string[] = [];
        
        const activeMyApps = myApps.filter((app: any) => app.status !== "cancelled" && app.status !== "rejected");

        if (activeMyApps.length > 0) {
          isJoined = true;
          isPartner = activeMyApps.some((app: any) => {
             const cleanPartnerP = (app.partnerId || "").replace(/[^0-9]/g, "");
             const isPhoneMatch = cleanPartnerP && currentCleanPhone && cleanPartnerP === currentCleanPhone;
             const isUidMatch = app.partnerId && app.partnerId === currentProfile?.id;
             return isPhoneMatch || isUidMatch;
          });
          joinedEvents = activeMyApps.map((app: any) => {
            const parts = app.group ? app.group.split(' ') : [];
            return { 
                type: app.category, 
                ageGroup: parts[0] || "", 
                level: parts[1] || "",
                isPending: app.status === "waiting_partner"
            };
          });
          
          appPartnerImages = [];
          const firstApp = activeMyApps[0];
          if (firstApp) {
             if (firstApp.partnerInfo?.avatarUrl) appPartnerImages.push(firstApp.partnerInfo.avatarUrl);
             if (firstApp.applicantInfo?.avatarUrl) appPartnerImages.push(firstApp.applicantInfo.avatarUrl);
          }
        }

        return {
          ...t,
          ...stats,
          isJoined,
          isPartner,
          joinedEvents,
          appPartnerImages,
          rawApps: myApps,
          invitations: tInvitations
        };
      });

      const allInvitations = enrichedTournaments
        .flatMap(t => t.invitations.map((inv: any) => ({ 
          ...inv, 
          tournamentName: t.name,
          tournamentDate: t.eventDates?.[0] || t.eventDate 
        })))
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

      // Sort
      const sorted = enrichedTournaments.sort((a, b) => {
        if (a.isJoined && !b.isJoined) return -1;
        if (!a.isJoined && b.isJoined) return 1;
        if (a.isJoined && b.isJoined) {
          const dateA = a.eventDates?.[0] || a.eventDate || "9999-99-99";
          const dateB = b.eventDates?.[0] || b.eventDate || "9999-99-99";
          return dateA.localeCompare(dateB);
        }
        const deadA = a.deadline || "9999-99-99";
        const deadB = b.deadline || "9999-99-99";
        return deadA.localeCompare(deadB);
      });

      set({ tournaments: sorted, notifications: notifs, invitations: allInvitations, loading: false });

      } catch (error: any) {
      console.error("Dashboard Load Error:", error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  markNotificationRead: async (id: string) => {
    await markNotificationAsRead(id);
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  leaveTeam: async (tournament: any, profile: PlayerProfile) => {
    const cleanPhone = profile.phone?.replace(/[^0-9]/g, "");
    const myApp = (tournament.rawApps || []).find((a: any) => {
        const cleanPartnerP = (a.partnerId || "").replace(/[^0-9]/g, "");
        const isPhoneMatch = cleanPartnerP && cleanPhone && cleanPartnerP === cleanPhone;
        const isUidMatch = a.partnerId && a.partnerId === profile.id;
        return isPhoneMatch || isUidMatch;
    });
    if (!myApp) return false;
    
    try {
      const res = await optOutPartner(myApp.id);
      return res.success;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}));
