import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { getStandardCategoryCode, updatePaymentStatus, cancelApplication } from "@/lib/firebase/applicationService";
import { extractInfo } from "@/utils/tournamentRules";
import { calculateTournamentStats } from "@/utils/tournamentUtils";
import { ExcelGeneratorService } from "@/services/ExcelGeneratorService";

interface Props {
    apps: any[];
    tournament?: any;
    fetchingApps: boolean;
    onDownloadExcel: () => void;
    onRefresh?: () => void; // 신청 현황 갱신용
}

type FilterMode = 'all' | 'byCategory' | 'byGrade' | 'unpaid';

export function ApplicantManagement({ apps, tournament, fetchingApps, onDownloadExcel, onRefresh }: Props) {
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [exportingForOrganizer, setExportingForOrganizer] = useState(false);

    // 1. 통합 통계 로직 사용 (회계 데이터 포함)
    const stats = calculateTournamentStats(apps, tournament);
    const { 
        totalTeams, totalPlayers, mdCount, wdCount, xdCount, sCount,
        totalExpectedFee, paidDoublesFee, paidSinglesFee
    } = stats;

    // 단식이 존재하는지 여부 (설정이나 신청 내역 기준)
    const hasSingles = sCount > 0 || Number(tournament?.feeSingles || 0) > 0;

    const handleTogglePayment = async (app: any) => {
        const currentStatus = app.paymentStatus || 'pending';
        const nextStatus = currentStatus === 'confirmed' ? 'pending' : 'confirmed';
        
        const res = await updatePaymentStatus(app.id, nextStatus);
        if (res.success) {
            // [추가] 입금 확인/해제 시 팀원 전체에게 알림 발송
            const { createNotification } = await import("@/lib/firebase/notificationService");
            const members = [app.userId, app.partnerId].filter(Boolean);
            const msg = nextStatus === 'confirmed' 
                ? `[${tournament?.name || '대회'}] ${app.category} ${app.group} 참가비 입금이 확인되었습니다.`
                : `[${tournament?.name || '대회'}] ${app.category} ${app.group} 참가비 입금을 요청드립니다.`;
            
            await Promise.all(members.map(mid => createNotification({
                userId: mid,
                type: 'info',
                tournamentId: tournament?.id || app.tournamentId,
                message: msg,
                isRead: false,
                createdAt: new Date().toISOString()
            })));

            onRefresh?.();
        }
    };

    const handleRequestPayment = async (app: any) => {
        const { createNotification } = await import("@/lib/firebase/notificationService");
        const members = [app.userId, app.partnerId].filter(Boolean);
        const msg = `[${tournament?.name || '대회'}] ${app.category} ${app.group} 참가비 입금을 요청드립니다.`;
        
        const res = await Promise.all(members.map(mid => createNotification({
            userId: mid,
            type: 'info',
            tournamentId: tournament?.id || app.tournamentId,
            message: msg,
            isRead: false,
            createdAt: new Date().toISOString()
        })));
        
        if (res.length > 0) alert("입금 요청 알림을 팀원 전체에게 발송하였습니다.");
    };

    const handleDeleteApp = async (appId: string) => {
        if (!window.confirm("이 접수 내역을 삭제(취소)하시겠습니까?")) return;
        const res = await cancelApplication(appId);
        if (res.success) onRefresh?.();
    };

    /**
     * [UI 통합] 주최 측 전송용 엑셀 다운로드 핸들러
     * - 기본적으로 '결제 완료(confirmed)'된 데이터만 필터링하여 익스포트
     */
    const handleDownloadForOrganizer = async () => {
        if (exportingForOrganizer) return;

        // [수정] 미입금팀도 포함하여 전체 활성 신청 내역 추출
        const targetApps = apps.filter(app => 
            app.status !== 'cancelled' && 
            app.status !== 'rejected'
        );

        if (targetApps.length === 0) {
            alert("출력할 수 있는 신청 내역이 없습니다.");
            return;
        }

        try {
            setExportingForOrganizer(true);
            const tName = tournament?.name || "대회";
            const res = await ExcelGeneratorService.generateTournamentExcel(targetApps, tName);
            if (res?.success) {
                const today = new Date().toISOString().split('T')[0];
                const year = new Date().getFullYear();
                alert(`${year}_${tName}_한콕두콕_${today}.xlsx 파일이 생성되었습니다.`);
            }
        } catch (error) {
            console.error("[Excel Export Error]", error);
            alert("엑셀 데이터 변환 중 오류가 발생했습니다. 로그를 확인하세요.");
        } finally {
            setExportingForOrganizer(false);
        }
    };

    // 2. 필터링 및 정렬 로직
    const activeApps = apps.filter(app => app.status !== 'cancelled' && app.status !== 'rejected');

    let processedApps = [...activeApps];
    if (filterMode === 'unpaid') {
        processedApps = processedApps.filter(app => app.paymentStatus !== 'confirmed');
    }

    // 그룹화가 필요한 모드일 경우 정렬 수행
    if (filterMode === 'byCategory') {
        processedApps.sort((a, b) => {
            const catA = getStandardCategoryCode(a.category);
            const catB = getStandardCategoryCode(b.category);
            if (catA !== catB) return catA.localeCompare(catB);
            const { grade: gradeA } = extractInfo(a.group);
            const { grade: gradeB } = extractInfo(b.group);
            return gradeA.localeCompare(gradeB);
        });
    } else if (filterMode === 'byGrade') {
        processedApps.sort((a, b) => {
            const { grade: gradeA } = extractInfo(a.group);
            const { grade: gradeB } = extractInfo(b.group);
            if (gradeA !== gradeB) return gradeA.localeCompare(gradeB);
            return getStandardCategoryCode(a.category).localeCompare(getStandardCategoryCode(b.category));
        });
    }

    const renderCard = (app: any) => {
        const { ageGroup, grade } = extractInfo(app.group);
        const categoryCode = getStandardCategoryCode(app.category);
        const cleanAge = ageGroup.replace('대', '');
        
        const isAwaiting = app.status === 'waiting_partner';
        const statusLabel = isAwaiting ? '승인 대기' : '참가 확정';
        const statusColor = isAwaiting ? '#007AFF' : '#34C759';

        const payStatus = app.paymentStatus || 'pending';
        const payLabel = payStatus === 'confirmed' ? '입금 확인' : '입금 대기';
        const payColor = payStatus === 'confirmed' ? '#34C759' : '#FF6B3D';
        
        const tBase = app.tournamentBaseYear || 2026;
        const partnerAge = app.partnerAppliedAge || (app.partnerInfo?.birthYear ? (tBase - app.partnerInfo.birthYear) : null);

        const formatPhone = (phone: string) => {
            const raw = (phone || "").replace(/[^0-9]/g, "");
            if (raw.length === 11) return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
            return phone;
        };

        const formatSize = (size: string) => {
            const map: Record<string, string> = { 
                "85": "XS", "90": "S", "95": "M", "100": "L", 
                "105": "XL", "110": "2XL", "115": "3XL" 
            };
            return map[size] || size;
        };

        return (
            <div key={app.id} style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #E5E5EA', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                {/* 접수 상태 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#1C1C1E' }}>
                        {categoryCode} {cleanAge} {grade}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: statusColor, background: isAwaiting ? 'rgba(0,122,255,0.1)' : 'rgba(52,199,89,0.1)', padding: '4px 8px', borderRadius: '6px' }}>{statusLabel}</div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: payColor, background: payStatus === 'confirmed' ? 'rgba(52,199,89,0.1)' : 'rgba(255,107,61,0.1)', padding: '4px 8px', borderRadius: '6px' }}>{payLabel}</div>
                    </div>
                </div>

                {/* 플레이어 정보 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr 0.7fr 1fr 2fr', alignItems: 'center', fontSize: '13px', borderBottom: app.partnerId ? '1px solid #F2F2F7' : 'none', paddingBottom: app.partnerId ? '12px' : '0' }}>
                        <span style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.applicantInfo?.realName || app.userName}</span>
                        <span style={{ textAlign: 'center' }}>{app.appliedAge || '-'}</span>
                        <span style={{ textAlign: 'center' }}>{app.appliedGrade || grade}</span>
                        <span style={{ textAlign: 'center' }}>{formatSize(app.applicantInfo?.tshirtSize || '-')}</span>
                        <a href={`tel:${app.applicantInfo?.phone || app.userId}`} style={{ textAlign: 'right', fontSize: '13px', color: '#1C1C1E', textDecoration: 'none', fontWeight: 500 }}>{formatPhone(app.applicantInfo?.phone || app.userId)}</a>
                    </div>

                    {app.partnerId && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr 0.7fr 1fr 2fr', alignItems: 'center', fontSize: '13px', paddingTop: '12px' }}>
                            <span style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.partnerInfo?.realName || '파트너'}</span>
                            <span style={{ textAlign: 'center' }}>{partnerAge || '-'}</span>
                            <span style={{ textAlign: 'center' }}>{app.partnerAppliedGrade || app.partnerInfo?.level || grade}</span>
                            <span style={{ textAlign: 'center' }}>{formatSize(app.partnerInfo?.tshirtSize || '-')}</span>
                            <a href={`tel:${app.partnerInfo?.phone || app.partnerId}`} style={{ textAlign: 'right', fontSize: '13px', color: '#1C1C1E', textDecoration: 'none', fontWeight: 500 }}>{formatPhone(app.partnerInfo?.phone || app.partnerId)}</a>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <button onClick={() => handleDeleteApp(app.id)} style={{ background: '#FFF2F2', border: '1px solid #FFD6D6', color: '#FF3B30', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>강제 취소</button>
                    {payStatus !== 'confirmed' && (
                        <button onClick={() => handleRequestPayment(app)} style={{ background: '#F2F2F7', border: 'none', color: '#000', padding: '10px 20px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', flex: 1 }}>입금 요청</button>
                    )}
                    <button onClick={() => handleTogglePayment(app)} style={{ background: payStatus === 'confirmed' ? '#f8f8f8' : '#000', border: 'none', color: payStatus === 'confirmed' ? '#8E8E93' : '#fff', padding: '10px 20px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', flex: 1 }}>{payStatus === 'confirmed' ? '확인 취소' : '입금 확인'}</button>
                </div>
            </div>
        );
    };

    return (
        <div className="applicants-management" style={{ marginTop: '20px' }}>
            {/* 1. Stats Summary Bar */}
            <div style={{ background: '#fff', padding: '16px 24px', borderRadius: '8px', border: '1px solid #E5E5EA', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 24px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'rgba(0,0,0,0.5)', fontWeight: 400 }}>Total</span>
                        <strong style={{ fontWeight: 800, fontSize: '14px', color: '#000' }}>{totalTeams}</strong>
                        <span style={{ color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>team</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>
                            (<strong style={{ fontWeight: 800, color: '#000' }}>{totalPlayers}</strong>명)
                        </span>
                        <span style={{ opacity: 0.2, margin: '0 4px 0 12px' }}>|</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(0,0,0,0.45)' }}>
                        <div>MD <strong style={{ fontWeight: 800, color: '#000' }}>{mdCount}</strong></div>
                        <span style={{ opacity: 0.15 }}>|</span>
                        <div>WD <strong style={{ fontWeight: 800, color: '#000' }}>{wdCount}</strong></div>
                        <span style={{ opacity: 0.15 }}>|</span>
                        <div>XD <strong style={{ fontWeight: 800, color: '#000' }}>{xdCount}</strong></div>
                        <span style={{ opacity: 0.15 }}>|</span>
                        <div>S <strong style={{ fontWeight: 800, color: '#000' }}>{sCount}</strong></div>
                    </div>
                </div>
            </div>

            {/* 2. Financial Stats Summary Bar */}
            <div style={{ background: '#F9F9FB', padding: '16px 24px', borderRadius: '8px', border: '1px solid #E5E5EA', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'rgba(0,0,0,0.5)', fontWeight: 400 }}>총 참가비</span>
                            <strong style={{ fontWeight: 800, fontSize: '14px', color: '#000' }}>₩{totalExpectedFee.toLocaleString()}</strong>
                        </div>
                        <span style={{ opacity: 0.15 }}>|</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'rgba(0,0,0,0.5)', fontWeight: 400 }}>현 입금 총액</span>
                            <strong style={{ fontWeight: 800, fontSize: '14px', color: '#000' }}>₩{(paidDoublesFee + paidSinglesFee).toLocaleString()}</strong>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px', borderTop: '1px solid #E5E5EA', paddingTop: '12px' }}>
                        <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                            복식 입금액 <strong style={{ fontWeight: 700, color: '#000' }}>₩{paidDoublesFee.toLocaleString()}</strong>
                        </div>
                        {hasSingles && (
                            <>
                                <span style={{ opacity: 0.1 }}>|</span>
                                <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                                    단식 입금액 <strong style={{ fontWeight: 700, color: '#000' }}>₩{paidSinglesFee.toLocaleString()}</strong>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Filter Options & Excel Button Group */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                {/* 필터 세그먼트 */}
                <div style={{ display: 'flex', background: '#F2F2F7', padding: '4px', borderRadius: '10px', gap: '2px' }}>
                    {(['all', 'byCategory', 'byGrade', 'unpaid'] as FilterMode[]).map(mode => {
                        const labels = { all: '전체', byCategory: '종목별', byGrade: '급수별', unpaid: '미입금' };
                        const isActive = filterMode === mode;
                        return (
                            <button 
                                key={mode}
                                onClick={() => setFilterMode(mode)}
                                style={{ 
                                    padding: '8px 16px', border: 'none', borderRadius: '8px', 
                                    fontSize: '13px', fontWeight: isActive ? 800 : 500,
                                    background: isActive ? '#fff' : 'transparent',
                                    color: isActive ? '#000' : '#8E8E93',
                                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                {labels[mode]}
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        className="btn-excel-organizer" 
                        style={{ 
                            background: '#1D6F42', color: '#fff', borderRadius: '8px', 
                            padding: '12px 20px', fontSize: '14px', fontWeight: 800, 
                            cursor: exportingForOrganizer ? 'not-allowed' : 'pointer', border: 'none', display: 'flex', 
                            alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(29,111,66,0.2)',
                            opacity: exportingForOrganizer ? 0.7 : 1, transition: 'all 0.2s'
                        }} 
                        onClick={handleDownloadForOrganizer}
                        disabled={exportingForOrganizer}
                    >
                        {exportingForOrganizer ? (
                            <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <Icon name="document" size={16} color="#fff" />
                        )}
                        주최 측 전송용 엑셀
                    </button>
                </div>
            </div>
            
            {/* 4. Applicant List Rendering */}
            <div className="applicant-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {fetchingApps ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#8E8E93' }}>신청자 목록을 불러오는 중...</div>
                ) : processedApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8E8E93', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed #E5E5EA' }}>신청 내역이 없습니다.</div>
                ) : (
                    filterMode === 'all' || filterMode === 'unpaid' ? (
                        processedApps.map(app => renderCard(app))
                    ) : (
                        // 그룹화 렌더링 (종목별/급수별)
                        (() => {
                            const groups: Record<string, any[]> = {};
                            processedApps.forEach(app => {
                                let key = "";
                                if (filterMode === 'byCategory') key = getStandardCategoryCode(app.category);
                                else {
                                    const { grade } = extractInfo(app.group);
                                    key = grade;
                                }
                                if (!groups[key]) groups[key] = [];
                                groups[key].push(app);
                            });

                            return Object.entries(groups).map(([groupName, groupApps]) => (
                                <div key={groupName} style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '4px', height: '14px', background: '#FF6B3D', borderRadius: '2px' }} />
                                        {groupName} ({groupApps.length}팀)
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                                        {groupApps.map(app => renderCard(app))}
                                    </div>
                                </div>
                            ));
                        })()
                    )
                )}
            </div>
        </div>
    );
}
