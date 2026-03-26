import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { usePartnerFilter } from "@/hooks/usePartnerFilter";
import "./PartnerSearch.css";
import { saveUserProfile, generateUserUid } from "@/lib/firebase/userService";
import { UserProfile } from "@/lib/types";

export function PartnerSearchSection({ onSelectPartner, applicantGender, selectedCategory, applyGrade, selfGrade, applyAgeGroup, selfAgeGroup, selfPhone, baseYear, tournamentRegion = 'local', excludePhones = [] }: any) {
    const [searchQuery, setSearchQuery] = useState("");
    const searchResults = usePartnerFilter({ searchQuery, selfPhone, selectedCategory, applicantGender, applyGrade, selfGrade, applyAgeGroup, baseYear, tournamentRegion, excludePhones });

    const selectMember = (member: any) => { onSelectPartner(member); setSearchQuery(""); };

    return (
        <div className="partner-search-section">
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
            </div>
        </div>
    );
}
