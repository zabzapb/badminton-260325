import { useState, useEffect } from "react";
import { getTournament } from "@/lib/firebase/tournamentService";
import { getApplicationsByUser, getApplicationsByTournament } from "@/lib/firebase/applicationService";
import { getUserProfile } from "@/lib/firebase/userService";
import { PlayerProfile } from "@/components/ui/PlayerProfileCard/PlayerProfileCard";
import { Tournament } from "@/lib/types";

export const useTournamentApplication = (id: string, isEdit: boolean = false) => {
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [tournament, setTournament] = useState<Tournament | null | "not_found">(null);
    const [loading, setLoading] = useState(true);
    const [allUserApps, setAllUserApps] = useState<any[]>([]);
    const [tournamentApps, setTournamentApps] = useState<any[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("hctc_user_profile");
        let profileObj: PlayerProfile | null = null;
        if (stored) {
            try { 
                profileObj = JSON.parse(stored);
                setProfile(profileObj); 
            } catch (e) { 
                console.error(e); 
            }
        }

        const loadData = async () => {
            // Clean the phone number for consistent lookup
            const phone = profileObj?.phone?.replace(/[^0-9]/g, "");
            const uid = profileObj?.id;

            // ── [추가] 리모트 프로필 가져오기 (아바타 등 최신화) ──
            if (uid) {
                const fbProfile = await getUserProfile(uid);
                if (fbProfile.success && fbProfile.data) {
                    const latest = fbProfile.data as PlayerProfile;
                    setProfile(latest);
                    localStorage.setItem("hctc_user_profile", JSON.stringify(latest));
                }
            }
            
            const [tRes, tApps, appsByPhone, appsByUid] = await Promise.all([
                getTournament(id),
                getApplicationsByTournament(id),
                phone ? getApplicationsByUser(phone) : Promise.resolve([]),
                (uid && uid !== phone) ? getApplicationsByUser(uid) : Promise.resolve([])
            ]);

            if (tRes.success && tRes.data) {
                setTournament(tRes.data as Tournament);
                setTournamentApps(tApps);
                
                // Merge and unique user apps
                const combined = [...(appsByPhone || []), ...(appsByUid || [])];
                const unique = Array.from(new Map(combined.map(a => [a.id, a])).values());
                setAllUserApps(unique);
            } else {
                setTournament("not_found");
            }
            setLoading(false);
        };
        loadData();
    }, [id, isEdit]);

    return { profile, tournament, loading, allUserApps, tournamentApps, setAllUserApps };
};

