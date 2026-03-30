import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/core/store/userStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { saveUserProfile, generateUserUid } from "@/lib/firebase/userService";
import { getRandomAvatarByGender } from "@/lib/avatar";
import { logger } from "@/core/utils/logger";

export const useUserProfileForm = () => {
    const navigate = useNavigate();
    const { profile, setProfile, persistProfile } = useUserStore();
    
    const [formData, setFormData] = useState({
        realName: "", nickname: "", referrer: "", gender: "M", birthDate: "", level: "D", club: "한콕두콕", phone: "",
        tshirtGender: "남성", tshirtSize: "-", avatarUrl: "", avatarChangeCount: 0, id: "", isVerified: false,
        originalRealName: "", originalGender: "", originalPhone: "", originalLevel: "", originalBirthDate: ""
    });
    const [loading, setLoading] = useState(true);
    const [isManualClub, setIsManualClub] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                ...profile as any,
                referrer: profile.referrer || "",
                club: profile.club || "한콕두콕",
                birthDate: profile.birthDate || (profile.birthYear ? `${profile.birthYear}-01-01` : ""),
                originalBirthDate: profile.birthDate || (profile.birthYear ? `${profile.birthYear}-01-01` : ""),
                originalRealName: profile.realName, 
                originalGender: profile.gender, 
                originalPhone: profile.phone, 
                originalLevel: profile.level
            });
            setIsManualClub(!!(profile.club && profile.club !== "한콕두콕" && profile.club !== "협회등록 안함"));
        }
        setLoading(false);
    }, [profile]);

    const handleAvatarShuffle = () => {
        if (formData.avatarChangeCount >= 3) return alert("변경 기회 소진");
        const used = JSON.parse(localStorage.getItem("hctc_used_avatars") || "[]");
        const newAvatar = getRandomAvatarByGender(formData.gender as "M" | "F", used);
        used.push(newAvatar);
        localStorage.setItem("hctc_used_avatars", JSON.stringify(used));
        setFormData(prev => ({ ...prev, avatarUrl: newAvatar, avatarChangeCount: prev.avatarChangeCount + 1 }));
    };

    const validateAndSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
        const birthYear = Number(formData.birthDate.split('-')[0]);
        
        const finalProfile = { 
            ...formData, 
            phone: cleanPhone, 
            id: formData.id || generateUserUid(cleanPhone), 
            birthYear,
            updatedAt: new Date().toISOString()
        };

        try {
            // 1. Remote Save
            const saveRes = await saveUserProfile(finalProfile as any);
            
            if (!saveRes.success) {
                const err: any = saveRes.error;
                const errMsg = `[Firestore Error] Code: ${err?.code || 'unknown'} | Message: ${err?.message || 'Check connection'}`;
                console.error("Profile save failed:", err);
                // [Traceability] Log raw error
                logger.log('ERROR', { event: 'FIREBASE_SAVE_FAILED', userId: finalProfile.id, status: 'FAILED', metadata: err });
                alert(`서버 저장에 실패했습니다.\n\n${errMsg}`);
                return; // [Strict] Stop execution on failure
            }
            
            // 2. Atomic Store Persistence (Zustand + IndexedDB)
            setProfile(finalProfile as any);
            await persistProfile(finalProfile as any);
            
            // 3. Sync Dashboard Store if already loaded
            useDashboardStore.getState().setProfileLocally(finalProfile as any);
            
            // 4. Fallback Local Storage
            localStorage.setItem("hctc_user_profile", JSON.stringify(finalProfile));
            
            alert("저장 완료");
            navigate("/dashboard");
        } catch (err: any) {
            console.error("Profile save exception:", err);
            alert(`저장 중 예외 발생: ${err?.message || err}`);
        }
    };

    return { formData, setFormData, loading, isManualClub, setIsManualClub, handleAvatarShuffle, validateAndSave };
};
