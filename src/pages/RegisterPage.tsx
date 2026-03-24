import React from "react";
import { useNavigate } from 'react-router-dom';
import { Icon } from "@/components/ui/Icon";
import { AppHeader } from "@/components/ui/AppHeader";
import { useUserProfileForm } from "@/hooks/useUserProfileForm";
import './RegisterPage.css';

export default function RegisterPage() {
    const navigate = useNavigate();
    const { formData, setFormData, loading, isManualClub, setIsManualClub, handleAvatarShuffle, validateAndSave } = useUserProfileForm();

    if (loading) return <div className="app-page"><AppHeader /><div>Loading Profile...</div></div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const formatPhone = (val: string) => {
        const num = val.replace(/[^0-9]/g, "").slice(0, 11);
        if (num.length <= 3) return num;
        if (num.length <= 7) return `${num.slice(0,3)}-${num.slice(3)}`;
        return `${num.slice(0,3)}-${num.slice(3,7)}-${num.slice(7)}`;
    };

    return (
        <div className="app-page">
            <AppHeader />
            <main className="app-body">
                <form onSubmit={validateAndSave}>
                    <div className="profile-management-hero" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h2 className="app-body-title" style={{ marginBottom: '4px' }}>프로필 관리</h2>
                            <span style={{ fontSize: '12px', fontWeight: 300, color: '#8E8E93' }}>Profile Management</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '-4px' }}>
                            <div style={{ position: 'relative' }}>
                                <img 
                                    src={formData.avatarUrl || "/profile_sample.png"} 
                                    style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                                    alt="프로필 아바타"
                                />
                            </div>
                            <button 
                                type="button" 
                                onClick={handleAvatarShuffle}
                                style={{ 
                                    background: '#F2F2F7', 
                                    border: '1px solid #C7C7CC', 
                                    borderRadius: '12px', 
                                    padding: '4px 10px', 
                                    fontSize: '11px', 
                                    fontWeight: 700, 
                                    color: '#8E8E93',
                                    cursor: 'pointer'
                                }}
                            >
                                교체 {3 - (formData.avatarChangeCount || 0)}회 남음
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>실명</label>
                        <input className="form-input-premium" value={formData.realName} readOnly disabled />
                    </div>
                    <div className="form-group">
                        <label>한콕두콕 닉네임 (선택)</label>
                        <input 
                            name="nickname"
                            className="form-input-premium" 
                            placeholder="한콕두콕 밴드에서 사용하는 닉네임을 입력합니다." 
                            value={formData.nickname || ""} 
                            onChange={handleChange} 
                        />
                    </div>
                    <div className="form-group">
                        <label>성별</label>
                        <div className="register-options-grid">
                            <button type="button" className={`option-chip ${formData.gender === "M" ? "option-chip--selected" : ""}`} disabled>남성</button>
                            <button type="button" className={`option-chip ${formData.gender === "F" ? "option-chip--selected" : ""}`} disabled>여성</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>연락처</label>
                        <input className="form-input-premium" value={formatPhone(formData.phone)} readOnly disabled />
                    </div>
                    <div className="form-group">
                        <label>생년월일</label>
                        <input name="birthDate" type="date" className="form-input-premium" value={formData.birthDate} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>구 급수 기준</label>
                        <div className="register-options-grid">
                            {["S", "A", "B", "C", "D", "E", "F"].map(lv => (
                                <button key={lv} type="button" className={`option-chip ${formData.level === lv ? "option-chip--selected" : ""}`} onClick={() => setFormData(p => ({ ...p, level: lv }))}>{lv}</button>
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
                                <button key={item.v} type="button" className={`option-chip ${formData.tshirtSize === item.v ? "option-chip--selected" : ""}`} onClick={() => setFormData(p => ({ ...p, tshirtSize: item.v }))}>{item.l}</button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>협회 등록 클럽</label>
                        <div className="register-options-grid">
                            {["한콕두콕", "협회등록 안함"].map(c => (
                                <button key={c} type="button" className={`option-chip ${!isManualClub && formData.club === c ? "option-chip--selected" : ""}`} onClick={() => { setIsManualClub(false); setFormData(p => ({ ...p, club: c })); }}>{c}</button>
                            ))}
                            <button type="button" className={`option-chip ${isManualClub ? "option-chip--selected" : ""}`} onClick={() => { setIsManualClub(true); setFormData(p => ({ ...p, club: "" })); }}>타 클럽</button>
                        </div>
                        {isManualClub && <input className="form-input-premium" placeholder="클럽명" value={formData.club} onChange={e => setFormData(p => ({ ...p, club: e.target.value }))} autoFocus />}
                    </div>
                    <footer className="form-action-footer">
                        <button type="button" onClick={() => navigate(-1)} className="btn-nav-back"><Icon name="arrow-right" size={20} style={{ transform: "rotate(180deg)" }} color="#000" /></button>
                        <button type="submit" className="btn-nav-next">SAVE</button>
                    </footer>
                </form>
            </main>
        </div>
    );
}
