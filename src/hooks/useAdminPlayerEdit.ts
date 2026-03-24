import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, saveUserProfile, deleteUserProfile } from "@/lib/firebase/userService";

export const useAdminPlayerEdit = (playerId: string) => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem("hctc_user_profile");
        if (stored) setCurrentUser(JSON.parse(stored));
        
        const fetch = async () => {
            if (!playerId) return;
            const res = await getUserProfile(playerId);
            if (res.success && res.data) {
                const fetched = res.data as any;
                setProfile({ ...fetched, originalRealName: fetched.realName, originalGender: fetched.gender, originalPhone: fetched.phone });
            } else { alert("실패"); navigate(-1); }
            setLoading(false);
        };
        fetch();
    }, [playerId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const clean = { ...profile, phone: profile.phone.replace(/[^0-9]/g, "") };
        if ((await saveUserProfile(clean)).success) { alert("완료"); navigate("/admin/players"); }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!window.confirm("삭제?")) return;
        if ((await deleteUserProfile(profile.id)).success) { alert("삭제됨"); navigate("/admin/players"); }
    };

    return { profile, setProfile, loading, saving, currentUser, handleSave, handleDelete };
};
