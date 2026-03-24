import React from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from "@/components/ui/AppHeader";
import { Icon } from "@/components/ui/Icon";
import { PhoneInput } from "@/components/ui/PhoneInput/PhoneInput";
import { useAdminPlayerEdit } from "@/hooks/useAdminPlayerEdit";
import "@/pages/RegisterPage.css";

export default function PlayerEditPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { profile, setProfile, loading, saving, handleSave, handleDelete } = useAdminPlayerEdit(id || "");

    if (loading) return <div className="app-page"><AppHeader /><div>Loading Profile...</div></div>;
    if (!profile) return <div>Profile not found</div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile((p: any) => p ? ({ ...p, [name]: name === 'birthYear' ? Number(value) : value }) : null);
    };

    return (
        <div className="app-page">
            <AppHeader />
            <div className="app-body" style={{ backgroundColor: '#EAE4DA' }}>
                <form onSubmit={handleSave}>
                    <div className="profile-management-hero" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <h2 className="app-body-title" style={{ marginBottom: 0 }}>
                                플레이어 정보 관리 <span style={{ fontWeight: 300, fontSize: '14px', color: '#8E8E93', verticalAlign: 'middle', marginLeft: '4px' }}>by manager</span>
                            </h2>
                            <span style={{ fontSize: '12px', fontWeight: 300, color: '#8E8E93' }}>
                                Player Information Management <span style={{ opacity: 0.7, fontSize: '11px' }}>by manager</span>
                            </span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '-4px' }}>
                            <div style={{ position: 'relative' }}>
                                <img 
                                    src={profile.avatarUrl || "/profile_sample.png"} 
                                    style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                                    alt="프로필 아바타"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', background: '#F2F2F7', padding: '4px 10px', borderRadius: '12px', border: '1px solid #C7C7CC' }}>
                                    UID: {profile.id.slice(-6).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>실명</label>
                        <input name="realName" className="form-input-premium" value={profile.realName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>한콕두콕 닉네임 (선택)</label>
                        <input 
                            name="nickname"
                            className="form-input-premium" 
                            placeholder="한콕두콕 밴드에서 사용하는 닉네임을 입력합니다." 
                            value={profile.nickname || ""} 
                            onChange={handleChange} 
                        />
                    </div>
                    <div className="form-group">
                        <label>성별</label>
                        <div className="register-options-grid">
                            <button type="button" className={`option-chip ${profile.gender === "M" ? "option-chip--selected" : ""}`} onClick={() => setProfile((p: any) => p ? ({ ...p, gender: "M" }) : null)}>남성</button>
                            <button type="button" className={`option-chip ${profile.gender === "F" ? "option-chip--selected" : ""}`} onClick={() => setProfile((p: any) => p ? ({ ...p, gender: "F" }) : null)}>여성</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>연락처</label>
                        <PhoneInput value={profile.phone} onChange={(v: string) => setProfile((p: any) => p? ({...p, phone: v}): null)} required />
                    </div>
                    <div className="form-group">
                        <label>생년월일</label>
                        <input name="birthDate" type="date" className="form-input-premium" value={profile.birthDate || (profile.birthYear ? `${profile.birthYear}-01-01` : "")} onChange={(e) => { const v = e.target.value; setProfile((p: any) => p ? ({ ...p, birthDate: v, birthYear: Number(v.split('-')[0]) }) : null); }} required />
                    </div>
                    <div className="form-group">
                        <label>구 급수 기준</label>
                        <div className="register-options-grid">
                            {["S", "A", "B", "C", "D", "E", "F"].map(lv => (
                                <button key={lv} type="button" className={`option-chip ${profile.level === lv ? "option-chip--selected" : ""}`} onClick={() => setProfile((p: any) => p ? ({ ...p, level: lv }) : null)}>{lv}</button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>티셔츠 사이즈 (대회 기념품용)</label>
                        <div className="register-options-grid">
                            {[
                                { v: "85", l: "XS" },
                                { v: "90", l: "S" },
                                { v: "95", l: "M" },
                                { v: "100", l: "L" },
                                { v: "105", l: "XL" },
                                { v: "110", l: "2XL" },
                                { v: "115", l: "3XL" }
                            ].map(item => (
                                <button key={item.v} type="button" className={`option-chip ${profile.tshirtSize === item.v ? "option-chip--selected" : ""}`} onClick={() => setProfile((p: any) => p ? ({ ...p, tshirtSize: item.v }) : null)}>{item.l}</button>
                            ))}
                        </div>
                    </div>
                    <footer className="form-action-footer">
                        <button type="button" onClick={() => navigate(-1)} className="btn-nav-back"><Icon name="arrow-right" size={20} style={{ transform: "rotate(180deg)" }} color="#000" /></button>
                        <button type="submit" className="btn-nav-next" disabled={saving}>{saving ? "SAVING..." : "SAVE CHANGES"}</button>
                        <button type="button" className="btn-nav-back" style={{ background: '#FF6B3D' }} onClick={handleDelete}><Icon name="trash" size={20} color="#fff" /></button>
                    </footer>
                </form>
            </div>
        </div>
    );
}
