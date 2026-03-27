import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { AppHeader } from "@/components/ui/AppHeader";
import { applyForTournament, updateApplicationStatus, cancelApplication } from "@/lib/firebase/applicationService";
import { createNotification } from "@/lib/firebase/notificationService";
import { findUserByPhone, getUserProfile } from "@/lib/firebase/userService";
import { Icon } from "@/components/ui/Icon";
import { TournamentApplication } from "@/lib/types";
import { LEVEL_LIST, calculateTournamentStats } from "@/utils/tournamentUtils";
import { extractInfo, getPlayerAgeGroup, isAgeGroupValid, isGradeAllowed, getCategoryCode } from "@/utils/tournamentRules";
import { useTournamentApplication } from "@/hooks/useTournamentApplication";
import { TournamentInfoBanner } from "./TournamentInfoBanner";
import { ApplicationFields } from "./ApplicationFields";
import '@/pages/TournamentApplyPage.css';
import "@/components/ui/TournamentStatusCard/TournamentStatusCard.css";
import { getTournamentTimeInfo } from "@/components/ui/TournamentStatusCard/TournamentStatusCard";

export function TournamentApplicationTemplate({ id, isEdit = false }: { id: string; isEdit?: boolean }) {
    const navigate = useNavigate();
    const { profile, tournament, loading, allUserApps, tournamentApps } = useTournamentApplication(id, isEdit);
    
    // Global states (mostly for category calculation/drafting)
    // [추가] 마감일 및 종료일 체크 로직
    const now = new Date();
    const isPastDeadline = (tournament as any)?.deadline 
        ? now > new Date((tournament as any).deadline + "T23:59:59") 
        : false;
    
    const lastDateStr = (tournament as any)?.eventDates?.length > 0 
        ? (tournament as any).eventDates[(tournament as any).eventDates.length - 1] 
        : (tournament as any)?.eventDate;
    const isFinished = lastDateStr ? now > new Date(lastDateStr + "T23:59:59") : false;

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
    const [originalAppId, setOriginalAppId] = useState<string | null>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('appId');
    });

    // Sync originalAppId from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const appIdParam = params.get('appId');
        if (appIdParam !== originalAppId) setOriginalAppId(appIdParam);
    }, [window.location.search, originalAppId]);

    // Submission Handler (Shared for both Draft and History cards)
    const handleApplySubmit = async (data: any) => {
        const category = data.category;
        const grade = data.grade;
        const ageGroup = data.ageGroup;
        const partner = data.partner;
        const appId = data.originalAppId || originalAppId;

        if (isPastDeadline) {
            return alert("접수 마감이 지나 신청 또는 수정을 할 수 없습니다.");
        }

        if (!profile || !category || !grade || !ageGroup) {
            return alert("필수 항목 입력을 확인해 주세요.");
        }

        const tBaseYear = (tournament as any).baseYear || 2026;
        const tObj = (tournament as any);
        const targetAgeObj = tObj.ageGroups?.find((g: any) => g.alias === ageGroup) || { id: "custom", sAge: 0, eAge: 999 };
        const applicantBirthYear = profile.birthYear || (profile.birthDate ? parseInt(profile.birthDate.split('-')[0]) : 1990);
        
        // Qualification
        if (!isGradeAllowed(tObj.regionType, grade, profile.level || "D") || 
            !isAgeGroupValid(tObj.regionType, targetAgeObj, applicantBirthYear, tBaseYear)) {
            return alert("본인의 신청 자격(연령/급수)이 맞지 않습니다.");
        }

        const isDoubles = !["단식", "S", "MS", "WS"].includes(category) && !category.endsWith("단");
        if (isDoubles && !partner) return alert("복식 종목은 파트너 선택이 필수입니다.");

        // [추가] 자강/준자강 특별 규정 검증
        if (grade === "자강" || grade === "준자강") {
            if (isDoubles && partner) {
                const myLevel = profile.level || "D";
                const pLevel = partner.level || "D";
                const eliteCount = (myLevel === "Elite" ? 1 : 0) + (pLevel === "Elite" ? 1 : 0);

                if (grade === "준자강" && eliteCount > 1) {
                    return alert("준자강 종목은 '엘리트(선출) 최대 1명'팀만 신청 가능합니다.\n(현재 선출 수: " + eliteCount + "명)");
                }
                // 자강은 선출 수 제한 없음 (0, 1, 2 모두 가능하거나 보통 2명이지만 상향 지원 허용)
            }
        }

        if (partner) {
            const pPhone = partner.phone?.replace(/[^0-9]/g, "");
            const selfPhone = profile.phone?.replace(/[^0-9]/g, "");
            
            if (pPhone === selfPhone) {
                return alert("본인을 파트너로 등록할 수 없습니다.");
            }

            const pLevel = partner.level || "D";
            const pBirthYear = partner.birthYear || 0;
            if (!isGradeAllowed(tObj.regionType, grade, pLevel) || 
                !isAgeGroupValid(tObj.regionType, targetAgeObj, pBirthYear, tBaseYear)) {
                return alert("파트너의 신청 자격(연령/급수)이 맞지 않습니다.");
            }
        }

        const cleanPhone = profile.phone.replace(/[^0-9]/g, "");
        const catCode = getCategoryCode(category);
        const groupSuffix = `${ageGroup}${grade}`.replace(/\s+/g, '');
        const finalId = appId || `${id}_${cleanPhone}_${catCode}_${groupSuffix}`;

        const applicationData: TournamentApplication = {
            id: finalId,
            tournamentId: id, 
            userId: cleanPhone, 
            category: category, 
            group: `${ageGroup} ${grade}`,
            ageGroupId: targetAgeObj.id, 
            tournamentBaseYear: tBaseYear, 
            appliedAge: tBaseYear - applicantBirthYear, 
            appliedGrade: profile.level || "D", // [수정] 종목 급수가 아닌 플레이어의 실제 급수 저장
            partnerId: partner?.id || partner?.phone?.replace(/[^0-9]/g, "") || null,
            partnerInfo: partner ? { ...partner, phone: partner.phone?.replace(/[^0-9]/g, "") } : null,
            applicantInfo: profile ? { ...profile, phone: profile.phone?.replace(/[^0-9]/g, "") } : null,
            status: isDoubles ? (!!partner ? "waiting_partner" : "partner_required") : "pending",
            paymentStatus: "pending", // [추가] 초기 입금 상태는 대기
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString()
        };

        const result = await applyForTournament(applicationData);
        if (result.success) { 
            alert("완료되었습니다."); 
            window.location.reload(); 
        } else {
            alert("오류: " + result.error);
        }
    };

    const handleCancelApp = async (appId: string, appData: any) => {
        if (isPastDeadline) {
            return alert("접수 마감이 지나 신청을 취소할 수 없습니다.");
        }
        if (!window.confirm("신청을 취소하시겠습니까?")) return;
        const res = await cancelApplication(appId);
        if (res.success) {
            const partnerId = appData.partnerId || appData.partnerInfo?.phone?.replace(/[^0-9]/g, "");
            const isMeApplicant = appData.userId === profile?.phone.replace(/[^0-9]/g, "");
            const targetId = isMeApplicant ? partnerId : appData.userId;
            if (targetId) {
                await createNotification({
                    userId: targetId,
                    title: "참가 신청 취소 안내",
                    message: `${profile?.realName}님의 요청으로 [${(tournament as any).name}] ${appData.category} ${appData.group} 신청이 취소되었습니다.`,
                    type: "system", isRead: false, createdAt: new Date().toISOString()
                } as any);
            }
            alert("취소되었습니다.");
            window.location.reload();
        }
    };

    if (loading || !tournament || tournament === "not_found") {
        return <div className="app-page"><AppHeader /><div>Loading...</div></div>;
    }

    const tApps = tournamentApps || [];
    const stats = calculateTournamentStats(tApps);

    const tournamentCats = ((tournament as any).categories || []).filter((cat: any) => {
        if (!profile) return true;
        const g = profile.gender || "M";
        if (g === "M" && ["여복", "WD", "여단", "WS"].includes(cat.type)) return false;
        if (g === "F" && ["남복", "MD", "남단", "MS"].includes(cat.type)) return false;
        return true;
    });

    return (
        <div className="app-page apply-page">
            <AppHeader />
            <main className="app-body">
                <div style={{ marginBottom: '32px' }}>
                    <h2 className="app-body-title">{!originalAppId ? "대회 참가 신청" : "참가 신청 관리"}</h2>
                </div>

                {(() => {
                    let displayDate = tournament.eventDate || "";
                    const ed = tournament.eventDates || [];
                    if (ed.length > 0) displayDate = ed.length === 1 ? ed[0].replace(/-/g, ".") : `${ed[0].replace(/-/g, ".")} - ${ed[1].split("-").pop()}`;
                    const { dday } = getTournamentTimeInfo(displayDate, tournament.deadline);
                    return (
                        <TournamentInfoBanner 
                            tournament={tournament} 
                            displayEventDate={displayDate} 
                            dDayStr={dday} 
                            formattedDeadline={tournament.deadline} 
                            stats={stats} 
                            selectedCategory={selectedCategory} 
                            handleCopy={() => { // [수정] 누락된 prop 추가
                                const info = `${tournament.account?.bank || ""} ${tournament.account?.accountNumber || ""} ${tournament.account?.owner || ""}`;
                                navigator.clipboard.writeText(info);
                                alert("계좌정보가 복사되었습니다.");
                            }}
                        />
                    );
                })()}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '120px' }}>
                    
                    {/* Summary Bar */}
                    {allUserApps.filter(a => a.tournamentId === id && a.status !== "cancelled" && a.status !== "rejected").length > 0 && (
                        <div className="apps-summary-bar" style={{ 
                            height: '76px', padding: '0 24px', background: '#fff', 
                            borderRadius: '12px', border: '1px solid #E5E5EA', 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' 
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, justifyContent: 'center' }}>
                                {(() => {
                                    const apps = allUserApps.filter(a => a.tournamentId === id && a.status !== "cancelled" && a.status !== "rejected");
                                    // Split into two rows if more than 1
                                    const row1 = apps.slice(0, Math.ceil(apps.length / 2));
                                    const row2 = apps.slice(Math.ceil(apps.length / 2));
                                    
                                    return (
                                        <>
                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {row1.map((app, i) => (
                                                    <React.Fragment key={app.id}>
                                                        <span onClick={() => document.getElementById(`app-card-${app.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} style={{ fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#1C1C1E' }}>
                                                            {getCategoryCode(app.category)} {app.group} {app.partnerInfo?.realName || ''} 
                                                            <span style={{ color: app.status === 'confirmed' ? '#34C759' : '#8E8E93', fontWeight: 500, marginLeft: '4px' }}>
                                                                ({app.status === 'confirmed' ? '확정' : '대기'})
                                                            </span>
                                                        </span>
                                                        {i < row1.length - 1 && <span style={{ color: '#E5E5EA' }}>|</span>}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            {row2.length > 0 && (
                                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    {row2.map((app, i) => (
                                                        <React.Fragment key={app.id}>
                                                            <span onClick={() => document.getElementById(`app-card-${app.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} style={{ fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#1C1C1E' }}>
                                                                {getCategoryCode(app.category)} {app.group} {app.partnerInfo?.realName || ''} 
                                                                <span style={{ color: app.status === 'confirmed' ? '#34C759' : '#8E8E93', fontWeight: 500, marginLeft: '4px' }}>
                                                                    ({app.status === 'confirmed' ? '확정' : '대기'})
                                                                </span>
                                                            </span>
                                                            {i < row2.length - 1 && <span style={{ color: '#E5E5EA' }}>|</span>}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            <button 
                                onClick={() => navigate(`/tournament/${id}/apply`)} 
                                style={{ 
                                    background: '#F2F2F7', border: 'none', borderRadius: '12px', 
                                    padding: '0 20px', fontSize: '14px', fontWeight: 800,
                                    height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                종목 추가 신청
                            </button>
                        </div>
                    )}

                    {/* HISTORY CARDS (Always Expanded) */}
                    {allUserApps.filter(a => a.tournamentId === id && a.status !== "cancelled" && a.status !== "rejected")
                        .map(app => (
                            <TournamentHistoryCard 
                                key={app.id} app={app} tournament={tournament} profile={profile} 
                                tournamentCats={tournamentCats} tournamentApps={tApps}
                                onApplySubmit={handleApplySubmit} onCancel={handleCancelApp}
                                isPastDeadline={isPastDeadline}
                            />
                        ))}

                    {/* DRAFT CARD */}
                    {(!originalAppId || window.location.pathname.endsWith('/apply')) && (
                        <ApplicationDraftCard 
                            id={id} tournament={tournament} profile={profile} tournamentCats={tournamentCats} 
                            allUserApps={allUserApps} tournamentApps={tApps} onApplySubmit={handleApplySubmit}
                            isPastDeadline={isPastDeadline}
                        />
                    )}
                </div>

                <footer className="floating-footer" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(transparent, rgba(234, 228, 218, 0.9))', zIndex: 10 }}>
                    <button onClick={() => navigate(-1)} className="btn-nav-back" style={{ background: '#fff', border: '1px solid #E5E5EA', borderRadius: '50%', width: '48px', height: '48px' }}>
                        <Icon name="arrow-left" size={20} color="#000" />
                    </button>
                </footer>
            </main>
        </div>
    );
}

function TournamentHistoryCard({ app, tournament, profile, tournamentCats, tournamentApps, onApplySubmit, onCancel, isPastDeadline }: any) {
    const { ageGroup: initAge, grade: initGrade } = extractInfo(app.group);
    const isOwner = (app.userId === profile?.phone.replace(/[^0-9]/g, "")) || (app.userId === profile?.id);
    
    const [category, setCategory] = useState(app.category);
    const [grade, setGrade] = useState(initGrade);
    const [ageGroup, setAgeGroup] = useState(initAge);
    
    // [개선] 파트너/신청자 정보 최신화 로직
    // 내가 신청자라면 '상대방'은 파트너, 내가 파트너라면 '상대방'은 신청자임
    const [otherPlayer, setOtherPlayer] = useState<any>(isOwner ? (app.partnerInfo || null) : (app.applicantInfo || { realName: '신청자', phone: app.userId }));
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        const fetchOtherLatest = async () => {
            // 내가 신청자면 파트너 ID, 내가 파트너면 신청자(userId) ID
            const targetId = isOwner 
                ? (app.partnerId || app.partnerInfo?.id || app.partnerInfo?.phone?.replace(/[^0-9]/g, ""))
                : (app.userId);
            
            if (!targetId) return;
            
            const res = await getUserProfile(targetId);
            if (res.success && res.data) {
                setOtherPlayer(res.data);
            }
        };
        fetchOtherLatest();
    }, [isOwner, app.partnerId, app.partnerInfo, app.userId, app.applicantInfo]);

    const catCfg = tournamentCats.find((c: any) => c.type === category || getCategoryCode(c.type) === getCategoryCode(category));
    const grades = Array.from(new Set((catCfg?.groups || []).map((g: string) => extractInfo(g).grade))).sort((a: any, b: any) => LEVEL_LIST.indexOf(a) - LEVEL_LIST.indexOf(b)) as string[];
    const ages = Array.from(new Set((catCfg?.groups || []).map((g: string) => extractInfo(g).ageGroup))) as string[];

    return (
        <div id={`app-card-${app.id}`} className="application-form-card" style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #E5E5EA', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{getCategoryCode(category)} {ageGroup} {grade}</h3>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: app.status === 'confirmed' ? '#34C759' : '#FF9500' }}>
                        {app.status === 'confirmed' ? '참가 확정' : (app.status === 'waiting_partner' ? '파트너 승인 대기' : '승인 대기')}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {isOwner && <button onClick={() => setEditMode(!editMode)} style={{ width: '32px', height: '32px', borderRadius: '16px', background: '#f8f8f8', border: 'none' }}><Icon name="edit" size={16} /></button>}
                    <button onClick={() => onCancel(app.id, app)} style={{ width: '32px', height: '32px', borderRadius: '16px', background: '#f8f8f8', border: 'none' }}><Icon name="trash" size={16} color="#FF3B30" /></button>
                </div>
            </div>

            <ApplicationFields 
                uniqueGrades={grades} uniqueAges={ages} selectedGrade={grade} selectedAgeGroup={ageGroup} 
                selectedCategory={category} setSelectedGrade={setGrade} setSelectedAgeGroup={setAgeGroup} setSelectedCategory={setCategory}
                tournamentCats={tournamentCats} profile={profile} tournament={tournament} isAppOwner={isOwner}
                currentPartner={otherPlayer} onPartnerSelect={setOtherPlayer} onBadgeClick={() => setEditMode(!editMode)} isApplicant={isOwner}
                excludePhones={[
                    ...(tournamentApps.filter((a: any) => a.id !== app.id && getCategoryCode(a.category) === getCategoryCode(category)).flatMap((a: any) => [a.userId, a.partnerId].filter(Boolean))),
                    profile?.phone?.replace(/[^0-9]/g, "")
                ].filter(Boolean)}
                status={app.status} showSelectionOptions={editMode}
            />

            {isOwner && editMode && !isPastDeadline && (otherPlayer || !["남복", "MD", "여복", "WD", "혼복", "XD"].includes(getCategoryCode(category))) && (
                <button 
                    onClick={() => onApplySubmit({ category, grade, ageGroup, partner: otherPlayer, originalAppId: app.id })} 
                    style={{ 
                        width: '100%', height: '54px', background: '#000', color: '#fff', 
                        borderRadius: '12px', fontWeight: 800, marginTop: '20px' 
                    }}
                >
                    수정 정보로 신청
                </button>
            )}
            {isPastDeadline && isOwner && (
                <div style={{ marginTop: '20px', padding: '12px', background: '#F2F2F7', borderRadius: '12px', fontSize: '13px', color: '#8E8E93', textAlign: 'center', fontWeight: 600 }}>
                    접수가 마감되어 정보를 수정할 수 없습니다.
                </div>
            )}
        </div>
    );
}

function ApplicationDraftCard({ id, tournament, profile, tournamentCats, allUserApps, tournamentApps, onApplySubmit, isPastDeadline }: any) {
    const [category, setCategory] = useState<string | null>(null);
    const [grade, setGrade] = useState<string | null>(null);
    const [age, setAge] = useState<string | null>(null);
    const [partner, setPartner] = useState<any | null>(null);

    useEffect(() => {
        if (!category && tournamentCats.length > 0) {
            const hasApps = (cat: string) => allUserApps.some((a: any) => a.tournamentId === id && getCategoryCode(a.category) === getCategoryCode(cat) && a.status !== 'cancelled');
            const available = tournamentCats.filter((c: any) => !hasApps(c.type));
            if (available.length > 0) setCategory(available[0].type);
        }
    }, [tournamentCats, allUserApps, id, category]);

    const catCfg = tournamentCats.find((c: any) => c.type === category);
    const grades = Array.from(new Set((catCfg?.groups || []).map((g: string) => extractInfo(g).grade))).sort((a: any, b: any) => LEVEL_LIST.indexOf(a) - LEVEL_LIST.indexOf(b)) as string[];
    const ages = Array.from(new Set((catCfg?.groups || []).map((g: string) => extractInfo(g).ageGroup))) as string[];

    useEffect(() => {
        if (category && catCfg) {
            const playerAge = getPlayerAgeGroup(profile.birthYear, (tournament as any).baseYear || 2026);
            const matchAge = ages.find(a => a.includes(playerAge.toString())) || ages[0];
            if (!age) setAge(matchAge);
            if (!grade) setGrade(grades.find(g => g === profile.level) || grades[0]);
        }
    }, [category, catCfg, ages, grades, profile, tournament, age, grade]);

    if (!category) return null;

    return (
        <div className="application-form-card" style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '2px solid #000', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>신규 종목 추가 신청</h3>
            <ApplicationFields 
                uniqueGrades={grades} uniqueAges={ages} selectedGrade={grade} selectedAgeGroup={age} 
                selectedCategory={category} setSelectedGrade={setGrade} setSelectedAgeGroup={setAge} setSelectedCategory={setCategory}
                tournamentCats={tournamentCats} profile={profile} tournament={tournament} isAppOwner={true}
                currentPartner={partner} onPartnerSelect={setPartner} isApplicant={true}
                excludePhones={[
                    ...(tournamentApps.filter((a: any) => getCategoryCode(a.category) === getCategoryCode(category || "")).flatMap((a: any) => [a.userId, a.partnerId].filter(Boolean))),
                    profile?.phone?.replace(/[^0-9]/g, "")
                ].filter(Boolean)}
                showSelectionOptions={true}
            />
            <button 
                onClick={() => onApplySubmit({ category, grade, ageGroup: age, partner })} 
                disabled={!category || !grade || !age || isPastDeadline} 
                style={{ 
                    width: '100%', height: '60px', 
                    background: isPastDeadline ? '#C7C7CC' : '#000', 
                    color: '#fff', 
                    borderRadius: '12px', 
                    fontWeight: 800, 
                    fontSize: '18px', 
                    marginTop: '32px',
                    cursor: isPastDeadline ? 'default' : 'pointer'
                }}
            >
                {isPastDeadline ? "접수 마감" : "신청 완료"}
            </button>
        </div>
    );
}
