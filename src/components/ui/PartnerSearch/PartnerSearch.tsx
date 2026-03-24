import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { usePartnerFilter } from "@/hooks/usePartnerFilter";
import "./PartnerSearch.css";
import { saveUserProfile, generateUserUid } from "@/lib/firebase/userService";
import { UserProfile } from "@/lib/types";

export function PartnerSearchSection({ onSelectPartner, applicantGender, selectedCategory, applyGrade, selfGrade, applyAgeGroup, selfAgeGroup, selfPhone, baseYear, tournamentRegion = 'local', excludePhones = [] }: any) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isManualEntry, setIsManualEntry] = useState(false);
    const searchResults = usePartnerFilter({ searchQuery, selfPhone, selectedCategory, applicantGender, applyGrade, selfGrade, applyAgeGroup, baseYear, tournamentRegion, excludePhones });


    const [phoneParts, setPhoneParts] = useState({ p1: "010", p2: "", p3: "" });
    const [manualForm, setManualForm] = useState({
        realName: "", phone: "", gender: (["여복", "WD", "여단", "WS"].includes(selectedCategory) ? "F" : "M") as "M" | "F",
        tshirtSize: "L", level: applyGrade || "D", birthDate: `${baseYear - 30}-01-01`,
        isVerified: false, // 게스트이므로 항상 비인증 상태
        createdAt: new Date().toISOString()
    });

    const selectMember = (member: any) => { onSelectPartner(member); setSearchQuery(""); setIsManualEntry(false); };

    const handleManualSubmit = async () => {
        const fullPhone = `${phoneParts.p1}${phoneParts.p2}${phoneParts.p3}`.replace(/[^0-9]/g, "");
        const selfPhoneClean = (selfPhone || "").replace(/[^0-9]/g, "");
        const cleanExclude = (excludePhones || []).map((p: string) => p.replace(/[^0-9]/g, ""));

        if (fullPhone.length < 10) {
            alert("휴대폰 번호를 정확히 입력해 주세요.");
            return;
        }

        if (fullPhone === selfPhoneClean) {
            alert("본인을 파트너로 등록하거나 선택할 수 없습니다.");
            return;
        }

        if (cleanExclude.includes(fullPhone)) {
            alert("해당 플레이어는 이미 이 종목에 등록되어 있어 파트너로 선택할 수 없습니다.");
            return;
        }
        if (!manualForm.realName) {
            alert("실명을 입력해 주세요.");
            return;
        }

        const birthYear = parseInt(manualForm.birthDate.split('-')[0]);
        const uid = generateUserUid(fullPhone);
        const guestData: UserProfile = {
            ...manualForm,
            id: uid,
            phone: fullPhone,
            birthYear
        };

        try {
            console.log("Registering Guest Player to DB...", guestData);
            // [추가] 게스트 플레이어를 users 컬렉션에 저장하여 '한콕두콕 플레이어' 메뉴에서 검색되도록 함
            const result = await saveUserProfile(guestData);
            if (result.success) {
                alert(`${manualForm.realName} 플레이어가 등록되었습니다.`);
                // 저장된 ID를 포함하여 파트너로 선택
                onSelectPartner({ ...guestData, id: result.id });
                setIsManualEntry(false); // 폼 초기화
                setSearchQuery("");
            } else {
                alert("플레이어 등록 중 오류가 발생했습니다: " + result.error);
            }
        } catch (error) {
            console.error("Guest registration failed:", error);
            alert("플레이어 등록 시스템 오류가 발생했습니다.");
        }
    };

    return (
        <div className="partner-search-section">
            {!isManualEntry ? (
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <Icon name="search" size={20} color="#C7C7CC" />
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="이름, 휴대폰 번호 등으로 검색" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                    </div>
                    
                    <div style={{ padding: '4px 8px' }}>
                        <span style={{ fontSize: '12px', color: '#8E8E93', lineHeight: '1.5' }}>
                            * 선택 종목에 신청할 수 있는 파트너만 검색이 됩니다.
                        </span>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="search-results animate-fade-in">
                            {searchResults.map((m: any) => (
                                <div key={m.id} className="result-item" onClick={() => selectMember(m)}>
                                    <div className="result-avatar" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                                        {(m.avatarUrl || m.avatar) ? <img src={m.avatarUrl || m.avatar} className="avatar-img" /> : m.realName?.charAt(0)}
                                    </div>
                                    <div className="result-info-compact" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                                        <span className="result-name" style={{ fontSize: '14px', fontWeight: 700, minWidth: '45px' }}>{m.realName}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8E8E93', whiteSpace: 'nowrap' }}>
                                            <span>{baseYear - (m.birthYear || 0)}세</span>
                                            <span style={{ color: '#E5E5EA' }}>|</span>
                                            <span style={{ fontWeight: 600, color: '#48484A' }}>{(m.level || "D").charAt(0)}</span>
                                            <span style={{ color: '#E5E5EA' }}>|</span>
                                            <span>{m.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                            type="button"
                            className="btn-manual-entry"
                            onClick={() => setIsManualEntry(true)}
                        >
                            게스트 플레이어 등록
                        </button>
                        <span style={{ fontSize: '11px', color: '#8E8E93', textAlign: 'center' }}>
                            * 게스트 플레이어는 대회 전까지 가입을 해야 합니다.
                        </span>
                    </div>
                </div>
            ) : (
                <div className="manual-form animate-fade-in">
                    <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '20px' }}>파트너 정보 직접 입력</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="input-group">
                            <input className="form-input-premium" placeholder="실명 입력" value={manualForm.realName} onChange={e => setManualForm({ ...manualForm, realName: e.target.value })} />
                        </div>

                        <div className="input-group">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button 
                                    key="M" type="button" 
                                    onClick={() => setManualForm({ ...manualForm, gender: 'M' })}
                                    style={{ 
                                        height: '44px', borderRadius: '10px', border: manualForm.gender === 'M' ? '2px solid #000' : '1px solid #E5E5EA',
                                        background: manualForm.gender === 'M' ? '#000' : '#fff', color: manualForm.gender === 'M' ? '#fff' : '#1C1C1E',
                                        fontSize: '14px', fontWeight: 700
                                    }}
                                >
                                    남성
                                </button>
                                <button 
                                    key="F" type="button" 
                                    onClick={() => setManualForm({ ...manualForm, gender: 'F' })}
                                    style={{ 
                                        height: '44px', borderRadius: '10px', border: manualForm.gender === 'F' ? '2px solid #000' : '1px solid #E5E5EA',
                                        background: manualForm.gender === 'F' ? '#000' : '#fff', color: manualForm.gender === 'F' ? '#fff' : '#1C1C1E',
                                        fontSize: '14px', fontWeight: 700
                                    }}
                                >
                                    여성
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px', display: 'block' }}>휴대폰 번호</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.25fr 1.25fr', gap: '8px' }}>
                                <input 
                                    className="form-input-premium" 
                                    type="tel" 
                                    placeholder="010" 
                                    maxLength={3}
                                    value={phoneParts.p1} 
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
                                        setPhoneParts(prev => ({ ...prev, p1: val }));
                                        if (val.length === 3) (document.getElementById('phone-p2') as HTMLInputElement)?.focus();
                                    }} 
                                    style={{ textAlign: 'center' }} 
                                />
                                <input 
                                    id="phone-p2"
                                    className="form-input-premium" 
                                    type="tel" 
                                    placeholder="1234" 
                                    maxLength={4}
                                    value={phoneParts.p2} 
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                                        setPhoneParts(prev => ({ ...prev, p2: val }));
                                        if (val.length === 4) (document.getElementById('phone-p3') as HTMLInputElement)?.focus();
                                    }} 
                                    style={{ textAlign: 'center' }} 
                                />
                                <input 
                                    id="phone-p3"
                                    className="form-input-premium" 
                                    type="tel" 
                                    placeholder="5678" 
                                    maxLength={4}
                                    value={phoneParts.p3} 
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                                        setPhoneParts(prev => ({ ...prev, p3: val }));
                                    }} 
                                    style={{ textAlign: 'center' }} 
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px', display: 'block' }}>급수</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                {["S", "A", "B", "C", "D", "E", "F"].map(lv => (
                                    <button 
                                        key={lv} type="button" 
                                        onClick={() => setManualForm({ ...manualForm, level: lv })}
                                        style={{ 
                                            height: '40px', borderRadius: '8px', border: manualForm.level === lv ? '2px solid #000' : '1px solid #E5E5EA',
                                            background: manualForm.level === lv ? '#000' : '#fff', color: manualForm.level === lv ? '#fff' : '#1C1C1E',
                                            fontSize: '13px', fontWeight: 700
                                        }}
                                    >
                                        {lv}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px', display: 'block' }}>생년월일</label>
                            <input 
                                className="form-input-premium" 
                                type="date" 
                                value={manualForm.birthDate} 
                                onClick={(e) => (e.target as any).showPicker?.()}
                                onChange={e => setManualForm({ ...manualForm, birthDate: e.target.value })} 
                                style={{ cursor: 'pointer' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                            <button 
                                type="button"
                                style={{ flex: 1, height: '52px', background: '#F2F2F7', color: '#1C1C1E', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '14px' }}
                                onClick={() => setIsManualEntry(false)}
                            >
                                취소
                            </button>
                            <button 
                                type="button" 
                                style={{ flex: 1.5, height: '52px', background: '#000', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '14px' }}
                                onClick={handleManualSubmit}
                            >
                                게스트 플레이어 등록
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
