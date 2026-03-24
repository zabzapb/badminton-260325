import React from "react";
import { isGradeAllowed, isAgeGroupValid, getCategoryCode } from "@/utils/tournamentRules";
import { PartnerSearchSection } from "@/components/ui/PartnerSearch/PartnerSearch";
import { PlayerProfileCard } from "@/components/ui/PlayerProfileCard/PlayerProfileCard";
import { Icon } from "@/components/ui/Icon";
import { BottomSheet } from "@/components/ui/BottomSheet/BottomSheet";

interface ApplicationFieldsProps {
    uniqueGrades: string[];
    uniqueAges: string[];
    selectedGrade: string | null;
    selectedAgeGroup: string | null;
    selectedCategory: string | null;
    setSelectedGrade: (g: string) => void;
    setSelectedAgeGroup: (a: string) => void;
    setSelectedCategory: (c: string) => void;
    tournamentCats: any[];
    profile: any;
    tournament: any;
    isAppOwner: boolean;
    currentPartner?: any;
    onPartnerSelect?: (partner: any) => void;
    onBadgeClick?: () => void; // [추가] 배지 클릭 이벤트
    isApplicant: boolean;
    includePhones?: string[];
    excludePhones?: string[];
    status?: string;
    showSelectionOptions?: boolean;
    unavailableCategories?: string[];
}

export const ApplicationFields: React.FC<ApplicationFieldsProps> = ({
    uniqueGrades, 
    uniqueAges, 
    selectedGrade, 
    selectedAgeGroup, 
    selectedCategory,
    setSelectedGrade, 
    setSelectedAgeGroup, 
    setSelectedCategory,
    tournamentCats,
    profile, 
    tournament, 
    isAppOwner,
    currentPartner,
    onPartnerSelect,
    onBadgeClick,
    isApplicant,
    excludePhones = [],
    status,
    showSelectionOptions = true,
    unavailableCategories = []
}) => {
    const isDoubles = !["단식", "S", "MS", "WS"].includes(selectedCategory || "");
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);

    return (
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* 1. Selection Group (Category, Grade & Age) - Moved to TOP */}
            {showSelectionOptions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '24px 18px', background: '#f8f8f8', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                    {/* A. Category Selection */}
                    <div className="selection-group">
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                            <label className="form-label" style={{ fontSize: '15px', fontWeight: 800, color: '#1C1C1E' }}>참가 종목 선택</label>
                            <span style={{ fontSize: '12px', color: '#8E8E93' }}>* 본인 급수 이상만 선택 가능</span>
                        </div>
                        <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                            {tournamentCats.map((cat: any) => {
                                const currentCatCode = getCategoryCode(cat.type);
                                const isUnavailable = (unavailableCategories || []).some(uc => uc && getCategoryCode(uc) === currentCatCode);
                                const isSelected = selectedCategory === cat.type;

                                return (
                                    <button 
                                        key={cat.type} 
                                        type="button" 
                                        onClick={() => !isUnavailable && setSelectedCategory(cat.type)}
                                        style={{ 
                                            height: '48px', 
                                            border: isSelected ? '2px solid #000' : (isUnavailable ? '1px solid #E5E5EA' : '1px solid #E5E5EA'), 
                                            borderRadius: '12px', 
                                            background: isSelected ? '#000' : (isUnavailable ? '#F2F2F7' : '#fff'), 
                                            color: isSelected ? '#fff' : (isUnavailable ? '#C7C7CC' : '#1C1C1E'),
                                            fontWeight: 800, fontSize: '14px',
                                            cursor: isUnavailable ? 'default' : 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >
                                        {cat.type}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ height: '1px', background: '#E5E5EA', margin: '2px 0' }} />

                    <div className="selection-group">
                        <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                            {uniqueGrades.map((lv) => {
                                const isAllowed = profile ? isGradeAllowed(tournament.regionType || 'local', lv, profile.level || "D") : false;
                                const isSelected = selectedGrade === lv;
                                return (
                                    <button 
                                        key={lv} 
                                        type="button" 
                                        onClick={() => isAllowed && isAppOwner && setSelectedGrade(lv)}
                                        style={{ 
                                            height: '48px', border: isSelected ? '2px solid #000' : '1px solid #E5E5EA', borderRadius: '12px', 
                                            background: isSelected ? '#000' : '#fff', color: isSelected ? '#fff' : '#1C1C1E',
                                            fontWeight: 800, fontSize: '14px', opacity: isAllowed ? 1 : 0.3, 
                                            cursor: (isAllowed && isAppOwner) ? 'pointer' : 'default',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {lv}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="selection-group">
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                            <label className="form-label" style={{ fontSize: '15px', fontWeight: 800, color: '#1C1C1E' }}>연령대 선택</label>
                            <span style={{ fontSize: '12px', color: '#8E8E93' }}>* 만 나이 기준 그룹 자동 판정</span>
                        </div>
                        <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                            {uniqueAges.map((age) => {
                                let targetAgeObj = tournament.ageGroups?.find((g: any) => g.alias === age);
                                if (!targetAgeObj) {
                                    const numericAge = parseInt(age.replace(/[^0-9]/g, ''));
                                    targetAgeObj = { sAge: numericAge, eAge: numericAge + 9 }; 
                                }
                                const applicantBirthYear = profile.birthYear || (profile.birthDate ? parseInt(profile.birthDate.split('-')[0]) : 0);
                                const isAllowed = profile ? isAgeGroupValid(tournament.regionType || 'local', targetAgeObj as any, applicantBirthYear, tournament.baseYear || 2026) : false;
                                const isSelected = selectedAgeGroup === age;
                                return (
                                    <button 
                                        key={age} 
                                        type="button" 
                                        onClick={() => isAllowed && isAppOwner && setSelectedAgeGroup(age)}
                                        style={{ 
                                            height: '48px', border: isSelected ? '2px solid #000' : '1px solid #E5E5EA', borderRadius: '12px', 
                                            background: isSelected ? '#000' : '#fff', color: isSelected ? '#fff' : '#1C1C1E',
                                            fontWeight: 800, fontSize: '14px', opacity: isAllowed ? 1 : 0.3, 
                                            cursor: (isAllowed && isAppOwner) ? 'pointer' : 'default',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {age}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Team Section - Show only if Category is selected, or if it's an existing app (status exists) */}
            {(selectedCategory || status) && (
                <div className="team-section animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    </div>

                    <div className="team-vertical-stack" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(() => {
                            const leader = isApplicant ? profile : currentPartner;
                            const member = isApplicant ? currentPartner : profile;
                            return (
                                <>
                                    <div style={{ background: '#fff', borderRadius: '12px', border: '2px solid #E5E5EA', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                        <PlayerProfileCard 
                                            profile={leader} variant="mini" theme="light"
                                            style={{ border: 'none', background: 'transparent' }} 
                                            isPending={false} 
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {member ? (
                                            <div style={{ background: '#fff', borderRadius: '12px', border: status === "waiting_partner" ? '2px solid #C7C7CC' : '2px solid #000', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}>
                                                <PlayerProfileCard 
                                                    profile={member as any} variant="mini" theme="light"
                                                    onDelete={isAppOwner ? () => onPartnerSelect?.(null) : undefined}
                                                    onBadgeClick={showSelectionOptions && isApplicant ? () => onPartnerSelect?.(null) : (isApplicant ? undefined : onBadgeClick)} 
                                                    badgeColor={showSelectionOptions && isApplicant ? "#FF6B3D" : undefined}
                                                    isCircle={showSelectionOptions && isApplicant} 
                                                    style={{ border: 'none', background: 'transparent' }} 
                                                    isPending={status === "waiting_partner"}
                                                />
                                            </div>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={() => setIsSearchOpen(true)}
                                                style={{ minHeight: '64px', background: '#F2F2F7', borderRadius: '12px', border: '1.5px dashed #C7C7CC', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#8E8E93', cursor: 'pointer', width: '100%' }}
                                            >
                                                <Icon name="person" size={20} color="#C7C7CC" />
                                                <span style={{ fontSize: '13px', fontWeight: 600 }}>신청한 종목으로 다시 파트너를 선택합니다.</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* 3. Partner Search UI - Moved to BottomSheet */}
            <BottomSheet 
                isOpen={isSearchOpen} 
                onClose={() => setIsSearchOpen(false)} 
                title="파트너 검색 및 임시 플레이어 등록"
            >
                <div style={{ paddingBottom: '32px' }}>
                    {isAppOwner && !currentPartner && onPartnerSelect && isDoubles && selectedCategory && (
                        <PartnerSearchSection 
                            onSelectPartner={(p: any) => {
                                onPartnerSelect(p);
                                setIsSearchOpen(false); // Close on selection
                            }} 
                            currentPartner={currentPartner}
                            selectedCategory={selectedCategory}
                            baseYear={tournament.baseYear || 2026}
                            selfPhone={profile.phone}
                            applicantGender={profile.gender}
                            applyGrade={selectedGrade}
                            applyAgeGroup={selectedAgeGroup}
                            tournamentRegion={tournament.regionType || 'local'}
                            excludePhones={excludePhones}
                        />
                    )}
                </div>
            </BottomSheet>
        </div>
    );
};
