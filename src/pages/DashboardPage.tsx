import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerProfileCard } from "@/components/ui/PlayerProfileCard/PlayerProfileCard";
import { TournamentPlayerCard } from "@/components/ui/TournamentStatusCard";
import { AppHeader } from "@/components/ui/AppHeader";
import { Icon } from "@/components/ui/Icon";
import { useDashboardStore } from "@/store/useDashboardStore";
import { createNotification } from "@/lib/firebase/notificationService";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { updateApplicationStatus } from "@/lib/firebase/applicationService";
import { getTournamentColor } from "@/utils/tournamentRules";
import "./DashboardPage.css";

export default function DashboardPage() {
    const navigate = useNavigate();
    const { profile, tournaments, notifications, invitations, loading, loadDashboard, markNotificationRead, leaveTeam, setProfileLocally } = useDashboardStore();
    const [showInvitations, setShowInvitations] = useState(false);
    const [hasCheckedInvitations, setHasCheckedInvitations] = useState(false);

    useEffect(() => {
        loadDashboard();
        const handleNavReset = () => {
            const cached = localStorage.getItem("hctc_user_profile");
            if (cached) {
                setProfileLocally(JSON.parse(cached));
            }
            // [추가] 로고 클릭 시 데이터 리프레시 수행
            loadDashboard();
        };
        window.addEventListener("popstate", handleNavReset);
        window.addEventListener("reset-dashboard", handleNavReset);
        return () => {
            window.removeEventListener("popstate", handleNavReset);
            window.removeEventListener("reset-dashboard", handleNavReset);
        };
    }, []);

    // [수정] 자동 팝업 노출 로직 제거: 오렌지색 배너 클릭 시에만 노출되도록 변경
    // useEffect(() => {
    //     if (!loading && invitations.length > 0 && !hasCheckedInvitations) {
    //         setShowInvitations(true);
    //         setHasCheckedInvitations(true);
    //     }
    // }, [loading, invitations, hasCheckedInvitations]);

    const handleLeaveTeam = async (t: any) => {
        if (!profile) return;
        const myApp = (t.rawApps || []).find((a: any) => a.partnerId === profile.phone);
        if (!myApp || !window.confirm(`[${t.name} - ${myApp.category} ${myApp.group}] 참가를 포기하시겠습니까?`)) return;

        if (await leaveTeam(t, profile)) {
            await createNotification({
                userId: myApp.userId,
                type: "warning",
                tournamentId: t.id,
                message: `⚠️ 파트너가 [${t.name}] 참가를 포기하였습니다. 새로운 파트너를 등록해 주세요.`,
                isRead: false,
                createdAt: new Date().toISOString()
            });
            alert("하차 처리 완료");
            window.location.reload();
        } else {
            alert("오류 발생");
        }
    };

    return (
        <div className="app-page">
            <AppHeader />
            <div className="app-body">
                {profile && (
                    <>
                        <PlayerProfileCard profile={profile} onEditProfile={() => navigate("/register")} onAvatarClick={() => navigate("/register")} showEntry={true} showRoleBadge={true} />
                        {profile?.realName === "최한웅" && !profile?.isMaster && (
                            <button 
                                onClick={async () => {
                                    const { saveUserProfile } = await import("@/lib/firebase/userService");
                                    const updated = { ...profile, isMaster: true, isManager: true };
                                    const res = await saveUserProfile(updated as any);
                                    if (res.success) {
                                        alert("마스터 권한이 복구되었습니다.");
                                        window.location.reload();
                                    } else {
                                        alert("복구 실패: " + JSON.stringify(res.error));
                                    }
                                }}
                                style={{ margin: '16px auto', padding: '12px 24px', background: '#FF6B3D', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'block', boxShadow: '0 8px 16px rgba(255,107,61,0.2)' }}
                            >
                                마스터 권한 복구하기 (Emergency Restore)
                            </button>
                        )}
                        {invitations.length > 0 && (
                            <div 
                                className="invitation-banner animate-slide-up" 
                                onClick={() => setShowInvitations(true)}
                                style={{ 
                                    padding: '16px 20px', borderRadius: '12px', background: '#FF6B3D', 
                                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                    marginTop: '30px', marginBottom: '10px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,107,61,0.2)' 
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon name="person" size={20} color="#fff" />
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: 800 }}>{invitations.length}건의 대회 파트너 요청이 있습니다</div>
                                        <div style={{ fontSize: '12px', opacity: 0.85, fontWeight: 500 }}>{invitations[0].tournamentName}{invitations.length > 1 ? ' 등' : ''}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {notifications.length > 0 && (
                            <div className="notification-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: invitations.length > 0 ? '0' : '30px', marginBottom: '16px' }}>
                                {notifications.map(n => (
                                    <div 
                                        key={n.id} 
                                        className={`notification-card type-${n.type}`} 
                                        style={{ 
                                            padding: '16px 20px', borderRadius: '12px', 
                                            background: '#EEF7FF', 
                                            border: '1px solid #BFE0FF', 
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            boxShadow: '0 4px 12px rgba(191,224,255,0.1)'
                                        }}
                                    >
                                        <div style={{ flex: 1, fontSize: '13px', color: '#1C1C1E', fontWeight: '500', lineHeight: '1.5', letterSpacing: '-0.3px' }}>
                                            {n.message}
                                        </div>
                                        <button 
                                            onClick={() => markNotificationRead(n.id!)} 
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.4, transition: 'opacity 0.2s', padding: '4px' }}
                                            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                                            onMouseOut={(e) => e.currentTarget.style.opacity = '0.4'}
                                        >
                                            <Icon name="close" size={18} color="#8E8E93" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
                <section aria-label="대회 목록" style={{ marginTop: (profile && (notifications.length > 0 || invitations.length > 0)) ? '0' : '30px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>대회 목록 로딩 ⏳</div>
                    ) : tournaments.length === 0 ? (
                        <div className="empty-state"><Icon name="trophy" size={48} color="var(--color-text-disabled)" /><p className="empty-state__title">등록된 대회가 없습니다</p></div>
                    ) : (
                        <div className="tournament-list-section" style={{ marginTop: '0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {tournaments.map(t => {
                                let displayDate = t.eventDate || "";
                                if (t.eventDates?.length > 0) {
                                    displayDate = t.eventDates.length === 1 ? t.eventDates[0].replace(/-/g, ".") : `${t.eventDates[0].replace(/-/g, ".")} - ${t.eventDates[1].split("-").pop()}`;
                                }
                                return (
                                    <div key={t.id} className="tournament-card-wrapper">
                                        <TournamentPlayerCard
                                            id={t.id} name={t.name} eventDate={displayDate} deadline={t.deadline} venue={t.venue} status={t.status}
                                            isJoined={t.isJoined} bgColor={getTournamentColor(t.id)} totalApplicants={t.totalApplicants || 0}
                                            totalTeams={t.totalTeams || 0} teamStats={t.teamStats || { md: 0, wd: 0, xd: 0, s: 0 }}
                                            isPartner={t.isPartner} joinedEvents={t.joinedEvents} partnerImages={t.appPartnerImages}
                                            onClick={() => {
                                                const cleanPhone = profile?.phone?.replace(/[^0-9]/g, "");
                                                if (t.isJoined) {
                                                    const myApp = (t.rawApps || []).find((a: any) => 
                                                        a.userId === cleanPhone || a.partnerId === cleanPhone
                                                    );
                                                    const targetUrl = myApp ? `/tournament/${t.id}/edit?appId=${myApp.id}` : `/tournament/${t.id}/apply`;
                                                    navigate(targetUrl);
                                                } else {
                                                    navigate(`/tournament/${t.id}/apply`);
                                                }
                                            }}
                                            onApply={() => {
                                                const cleanPhone = profile?.phone?.replace(/[^0-9]/g, "");
                                                if (t.isJoined) {
                                                    const myApp = (t.rawApps || []).find((a: any) => 
                                                        a.userId === cleanPhone || a.partnerId === cleanPhone
                                                    );
                                                    const targetUrl = myApp ? `/tournament/${t.id}/edit?appId=${myApp.id}` : `/tournament/${t.id}/apply`;
                                                    navigate(targetUrl);
                                                } else {
                                                    navigate(`/tournament/${t.id}/apply`);
                                                }
                                            }}
                                            onLeave={() => handleLeaveTeam(t)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <BottomSheet 
                isOpen={showInvitations && invitations.length > 0} 
                onClose={() => setShowInvitations(false)}
                title="파트너 요청 승인"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto', paddingBottom: '20px' }}>
                    {invitations.map((inv) => (
                        <div key={inv.id} style={{ background: '#F2F2F7', padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <h4 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '4px', color: '#1C1C1E' }}>{inv.tournamentName}</h4>
                                <div style={{ fontSize: '13px', color: '#8E8E93' }}>{inv.tournamentDate?.replace(/-/g, ".")}</div>
                            </div>
                            
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1C1C1E' }}>
                                {inv.category} {inv.group} 파트너 요청자 {inv.applicantInfo?.realName}
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={async () => {
                                        if (window.confirm("초대를 거절하시겠습니까?")) {
                                            await updateApplicationStatus(inv.id, "rejected");
                                            loadDashboard();
                                        }
                                    }}
                                    style={{ flex: 1, height: '52px', background: '#fff', color: '#666', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                                >
                                    거절
                                </button>
                                <button 
                                    onClick={async () => {
                                        const res = await updateApplicationStatus(inv.id, "confirmed");
                                        if (res.success) {
                                            alert("참가 신청이 수락되었습니다!");
                                            loadDashboard();
                                        }
                                    }}
                                    style={{ flex: 2, height: '52px', background: '#000', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                >
                                    파트너 요청 승인
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </BottomSheet>
        </div>
    );
}

