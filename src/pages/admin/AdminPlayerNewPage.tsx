import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from "@/components/ui/AppHeader";
import { Icon } from "@/components/ui/Icon";
import { saveUserProfile, generateUserUid } from "@/lib/firebase/userService";
import { UserProfile } from "@/lib/types";
import { getRandomAvatarByGender } from "@/lib/avatar";
import { PhoneInput } from "@/components/ui/PhoneInput/PhoneInput";
import "@/pages/RegisterPage.css";

export default function AdminNewPlayerPage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isManualClub, setIsManualClub] = useState(false);

    const [profile, setProfile] = useState({
        realName: "",
        nickname: "",
        gender: "M",
        phone: "",
        birthYear: 1990,
        birthDate: "1990-01-01",
        level: "D",
        tshirtSize: "L",
        club: "한콕두콕",
        isManager: false,
        isMaster: false
    });

    useEffect(() => {
        const stored = localStorage.getItem("hctc_user_profile");
        if (stored) {
            const parsed = JSON.parse(stored);
            setCurrentUser(parsed);
            if (!parsed.isMaster && !parsed.isManager) {
                alert("권한이 없습니다.");
                navigate("/admin/players");
            }
        } else {
            navigate("/login");
        }
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: name === 'birthYear' ? Number(value) : value }));
    };

    const handlePhoneChange = (value: string) => {
        setProfile(prev => ({ ...prev, phone: value }));
    };

    const handleSelectOption = (name: string, value: any) => {
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const usedAvatarsStr = localStorage.getItem("hctc_used_avatars");
            const usedAvatars: string[] = usedAvatarsStr ? JSON.parse(usedAvatarsStr) : [];
            const avatarUrl = getRandomAvatarByGender(profile.gender as "M" | "F", usedAvatars);
            
            const cleanPhone = profile.phone.replace(/[^0-9]/g, "");
            const uid = generateUserUid(cleanPhone);
            const finalProfile: UserProfile = {
                ...profile,
                nickname: profile.nickname || "",
                gender: profile.gender as "M" | "F",
                tshirtGender: profile.gender === "M" ? "남성" : "여성",
                phone: cleanPhone, // Store only numbers
                id: uid,
                avatarUrl,
                avatarChangeCount: 0,
                isVerified: false, // Manually registered, not yet Naver verified
                registeredBy: currentUser?.id, // Track who registered
                birthDate: profile.birthDate || `${profile.birthYear}-01-01`, // 상태에 있는 생년월일 사용 (없으면 보정)
                createdAt: new Date().toISOString()
            };

            const result = await saveUserProfile(finalProfile);
            if (result.success) {
                alert("플레이어 정보가 등록되었습니다.");
                navigate("/admin/players");
            } else {
                alert("등록 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error(error);
            alert("처리 중 오류 발생");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-page">
            <AppHeader />
            <div className="app-body" style={{ backgroundColor: '#EAE4DA' }}>
                <form onSubmit={handleSave}>
                    <div className="profile-management-hero" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    <Icon name="arrow-left" size={24} />
                                </button>
                                <h2 className="app-body-title" style={{ marginBottom: 0 }}>신규 플레이어 등록</h2>
                            </div>
                            <span className="app-body-subtitle" style={{ marginLeft: '32px', marginTop: '4px', fontSize: '12px' }}>Add New Player Manually</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">실명</label>
                        <input
                            name="realName"
                            className="form-input-premium"
                            value={profile.realName}
                            onChange={handleChange}
                            placeholder="성함을 입력하세요"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">성별</label>
                        <div className="register-options-grid">
                            <button
                                type="button"
                                className={`option-chip ${profile.gender === "M" ? "option-chip--selected" : ""}`}
                                onClick={() => handleSelectOption("gender", "M")}
                                style={{ flex: 1 }}
                            >
                                남성
                            </button>
                            <button
                                type="button"
                                className={`option-chip ${profile.gender === "F" ? "option-chip--selected" : ""}`}
                                onClick={() => handleSelectOption("gender", "F")}
                                style={{ flex: 1 }}
                            >
                                여성
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">연락처</label>
                        <PhoneInput
                            value={profile.phone}
                            onChange={handlePhoneChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">생년월일</label>
                        <input
                            name="birthDate"
                            type="date"
                            className="form-input-premium"
                            value={profile.birthDate || (profile.birthYear ? `${profile.birthYear}-01-01` : "")}
                            onChange={(e) => {
                                const val = e.target.value;
                                const year = Number(val.split('-')[0]);
                                setProfile(prev => ({ ...prev, birthDate: val, birthYear: year }));
                            }}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">급수</label>
                        <div className="register-options-grid">
                            {["S", "A", "B", "C", "D", "E", "F"].map((lv) => (
                                <button
                                    key={lv}
                                    type="button"
                                    className={`option-chip ${profile.level === lv ? "option-chip--selected" : ""}`}
                                    onClick={() => handleSelectOption("level", lv)}
                                >
                                    {lv === "E" ? "초심" : lv === "F" ? "왕초심" : `${lv}조`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <footer className="form-action-footer" style={{ marginTop: '40px' }}>
                        <button type="button" className="btn-nav-back" onClick={() => navigate(-1)}>
                            <Icon name="close" size={20} color="#000" />
                        </button>
                        <button type="submit" className="btn-nav-next" style={{ flex: 1 }} disabled={saving}>
                            {saving ? "SAVING..." : "REGISTER PLAYER"}
                        </button>
                    </footer>
                </form>
                <div style={{ height: '100px' }} />
            </div>
        </div>
    );
}
