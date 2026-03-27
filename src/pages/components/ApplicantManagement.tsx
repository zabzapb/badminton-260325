import { Icon } from "@/components/ui/Icon";
import { getStandardCategoryCode, updatePaymentStatus, cancelApplication } from "@/lib/firebase/applicationService";
import { extractInfo } from "@/utils/tournamentRules";

interface Props {
    apps: any[];
    fetchingApps: boolean;
    onDownloadExcel: () => void;
    onRefresh?: () => void; // 신청 현황 갱신용
}

export function ApplicantManagement({ apps, fetchingApps, onDownloadExcel, onRefresh }: Props) {
    // 1. [필터링] 취소되거나 거절된 신청은 제외
    const activeApps = apps.filter(app => app.status !== 'cancelled' && app.status !== 'rejected');
    
    // Stats calculation based on active apps
    const totalTeams = activeApps.length;
    const uniquePeople = new Set(activeApps.flatMap(a => [a.userId, a.partnerId].filter(Boolean))).size;
    
    const catCounts: Record<string, number> = {};
    activeApps.forEach(app => {
        const code = getStandardCategoryCode(app.category);
        catCounts[code] = (catCounts[code] || 0) + 1;
    });

    const categorySummary = Object.entries(catCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([code, count]) => `${code} ${count}`)
        .join('  ');

    const handleTogglePayment = async (appId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'confirmed' ? 'pending' : 'confirmed';
        const res = await updatePaymentStatus(appId, nextStatus);
        if (res.success) onRefresh?.();
    };

    const handleDeleteApp = async (appId: string) => {
        if (!window.confirm("이 접수 내역을 삭제(취소)하시겠습니까?")) return;
        const res = await cancelApplication(appId);
        if (res.success) onRefresh?.();
    };

    return (
        <div className="applicants-management" style={{ marginTop: '20px' }}>
            {/* Stats Summary Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ fontSize: '14px', color: '#1C1C1E', background: '#F2F2F7', padding: '14px 24px', borderRadius: '12px', fontWeight: 800, border: '1px solid #E5E5EA' }}>
                    Total <span style={{ color: '#FF6B3D' }}>{totalTeams}</span> team ({uniquePeople}명) 
                    <span style={{ color: '#C7C7CC', margin: '0 16px' }}>|</span>
                    {categorySummary}
                </div>
                <button className="btn-excel-download" style={{ background: '#000', color: '#fff', borderRadius: '10px', padding: '12px 24px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={onDownloadExcel}>
                    <Icon name="document" size={16} color="#fff" /> Excel 다운로드
                </button>
            </div>
            <div className="applicant-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {fetchingApps ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#8E8E93' }}>신청자 목록을 불러오는 중...</div>
                ) : activeApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8E8E93', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', border: '1px dashed #E5E5EA' }}>현재 접수된 팀이 없습니다.</div>
                ) : (
                    activeApps.map((app: any) => {
                        const { ageGroup, grade } = extractInfo(app.group);
                        const categoryCode = getStandardCategoryCode(app.category);
                        const cleanAge = ageGroup.replace('대', '');
                        
                        // Status Logic
                        const isAwaiting = app.status === 'waiting_partner';
                        const statusLabel = isAwaiting ? '승인 대기' : '신청 확정';
                        const statusColor = isAwaiting ? '#007AFF' : '#34C759';

                        // Payment Logic
                        const payStatus = app.paymentStatus || 'pending';
                        const payLabel = payStatus === 'confirmed' ? '입금 확인' : '입금 대기';
                        const payColor = payStatus === 'confirmed' ? '#34C759' : '#FF6B3D';
                        
                        // Age Calculation (Fixed for partner)
                        const tBase = app.tournamentBaseYear || 2026;
                        const partnerAge = app.partnerAppliedAge || (app.partnerInfo?.birthYear ? (tBase - app.partnerInfo.birthYear) : null);

                        // Phone Formatter (Full number with hyphens)
                        const formatPhone = (phone: string) => {
                            const raw = (phone || "").replace(/[^0-9]/g, "");
                            if (raw.length === 11) {
                                return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
                            }
                            return phone;
                        };

                        // T-shirt size mapper
                        const formatSize = (size: string) => {
                            const map: Record<string, string> = { 
                                "85": "XS", "90": "S", "95": "M", "100": "L", 
                                "105": "XL", "110": "2XL", "115": "3XL" 
                            };
                            return map[size] || size;
                        };

                        return (
                            <div key={app.id} style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E5E5EA', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                                {/* 접수 상태 헤더 */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#1C1C1E' }}>
                                        {categoryCode} {cleanAge} {grade}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {/* 상태 배지 1: 승인/신청 상태 */}
                                        <div style={{ 
                                            fontSize: '11px', fontWeight: 800, color: statusColor, 
                                            background: isAwaiting ? 'rgba(0,122,255,0.1)' : 'rgba(52,199,89,0.1)', 
                                            padding: '4px 8px', borderRadius: '6px' 
                                        }}>
                                            {statusLabel}
                                        </div>
                                        {/* 상태 배지 2: 입금 상태 */}
                                        <div style={{ 
                                            fontSize: '11px', fontWeight: 800, color: payColor, 
                                            background: payStatus === 'confirmed' ? 'rgba(52,199,89,0.1)' : 'rgba(255,107,61,0.1)', 
                                            padding: '4px 8px', borderRadius: '6px' 
                                        }}>
                                            {payLabel}
                                        </div>
                                    </div>
                                </div>

                                {/* 플레이어 정보: [이름] [나이] [급수] [티셔츠] [전화번호] */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {/* 신청자 */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr 0.7fr 1fr 2fr', alignItems: 'center', fontSize: '13px', borderBottom: app.partnerId ? '1px solid #F2F2F7' : 'none', paddingBottom: app.partnerId ? '12px' : '0' }}>
                                        <span style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.applicantInfo?.realName || app.userName}</span>
                                        <span style={{ textAlign: 'center' }}>{app.appliedAge || '-'}</span>
                                        <span style={{ textAlign: 'center' }}>{app.appliedGrade || grade}</span>
                                        <span style={{ textAlign: 'center' }}>{formatSize(app.applicantInfo?.tshirtSize || '-')}</span>
                                        <a href={`tel:${app.applicantInfo?.phone || app.userId}`} style={{ textAlign: 'right', fontSize: '13px', color: '#1C1C1E', textDecoration: 'none', fontWeight: 500 }}>
                                            {formatPhone(app.applicantInfo?.phone || app.userId)}
                                        </a>
                                    </div>

                                    {/* 파트너 */}
                                    {app.partnerId && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr 0.7fr 1fr 2fr', alignItems: 'center', fontSize: '13px', paddingTop: '12px' }}>
                                            <span style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.partnerInfo?.realName || '파트너'}</span>
                                            <span style={{ textAlign: 'center' }}>{partnerAge || '-'}</span>
                                            <span style={{ textAlign: 'center' }}>{app.partnerAppliedGrade || app.partnerInfo?.level || grade}</span>
                                            <span style={{ textAlign: 'center' }}>{formatSize(app.partnerInfo?.tshirtSize || '-')}</span>
                                            <a href={`tel:${app.partnerInfo?.phone || app.partnerId}`} style={{ textAlign: 'right', fontSize: '13px', color: '#1C1C1E', textDecoration: 'none', fontWeight: 500 }}>
                                                {formatPhone(app.partnerInfo?.phone || app.partnerId)}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                    <button 
                                        onClick={() => handleDeleteApp(app.id)}
                                        style={{ background: '#FFF2F2', border: '1px solid #FFD6D6', color: '#FF3B30', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        접수 강제 취소
                                    </button>
                                    <button 
                                        onClick={() => handleTogglePayment(app.id, payStatus)}
                                        style={{ 
                                            background: payStatus === 'confirmed' ? '#f8f8f8' : '#000', 
                                            border: 'none', color: payStatus === 'confirmed' ? '#8E8E93' : '#fff', 
                                            padding: '10px 20px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', flex: 1 
                                        }}
                                    >
                                        {payStatus === 'confirmed' ? '입금 확인 취소' : '입금 확인 완료'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
