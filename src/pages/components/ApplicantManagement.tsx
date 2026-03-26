import { Icon } from "@/components/ui/Icon";
import { getStandardCategoryCode } from "@/lib/firebase/applicationService";
import { extractInfo } from "@/utils/tournamentRules";

interface Props {
    apps: any[];
    fetchingApps: boolean;
    onDownloadExcel: () => void;
}

export function ApplicantManagement({ apps, fetchingApps, onDownloadExcel }: Props) {
    // Stats calculation
    const totalTeams = apps.length;
    const uniquePeople = new Set(apps.flatMap(a => [a.userId, a.partnerId].filter(Boolean))).size;
    
    const catCounts: Record<string, number> = {};
    apps.forEach(app => {
        const code = getStandardCategoryCode(app.category);
        catCounts[code] = (catCounts[code] || 0) + 1;
    });

    const categorySummary = Object.entries(catCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([code, count]) => `${code} ${count}`)
        .join('  ');

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
            <div className="applicant-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {fetchingApps ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#8E8E93' }}>신청자 목록을 불러오는 중...</div>
                ) : apps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8E8E93', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', border: '1px dashed #E5E5EA' }}>현재 신청한 팀이 없습니다.</div>
                ) : (
                    apps.map((app: any) => {
                        const { ageGroup, grade } = extractInfo(app.group);
                        const categoryCode = getStandardCategoryCode(app.category);
                        const cleanAge = ageGroup.replace('대', '');
                        
                        return (
                            <div key={app.id} style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E5E5EA', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                {/* Category Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#1C1C1E', letterSpacing: '-0.02em' }}>
                                        {categoryCode} {cleanAge} {grade}
                                    </div>
                                    <span style={{ 
                                        fontSize: '11px', fontWeight: 700, 
                                        color: app.status === 'confirmed' ? '#34C759' : (app.status === 'waiting_partner' ? '#007AFF' : '#FF6B3D'), 
                                        background: app.status === 'confirmed' ? 'rgba(52,199,89,0.1)' : (app.status === 'waiting_partner' ? 'rgba(0,122,255,0.1)' : 'rgba(255,107,61,0.1)'), 
                                        padding: '4px 8px', borderRadius: '6px' 
                                    }}>
                                        {app.status === 'confirmed' ? '결제완료' : (app.status === 'waiting_partner' ? '수락대기' : '입금대기')}
                                    </span>
                                </div>

                                {/* Player Info Table */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Applicant Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', alignItems: 'center', fontSize: '14px' }}>
                                        <span style={{ fontWeight: 800, color: '#1C1C1E' }}>{app.applicantInfo?.realName || app.userName}</span>
                                        <span style={{ color: '#8E8E93', textAlign: 'center' }}>{app.applicantInfo?.birthYear || '-'}</span>
                                        <span style={{ color: '#8E8E93', textAlign: 'center' }}>{app.appliedGrade || grade}</span>
                                        <span style={{ color: '#8E8E93', textAlign: 'right' }}>{app.applicantInfo?.tshirtSize || 'XL'}</span>
                                    </div>

                                    {/* Partner Row */}
                                    {app.partnerId && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', alignItems: 'center', fontSize: '14px', paddingTop: '12px', borderTop: '1px solid #F2F2F7' }}>
                                            <span style={{ fontWeight: 800, color: '#1C1C1E' }}>{app.partnerInfo?.realName || '파트너'}</span>
                                            <span style={{ color: '#8E8E93', textAlign: 'center' }}>{app.partnerInfo?.birthYear || '-'}</span>
                                            <span style={{ color: '#8E8E93', textAlign: 'center' }}>{app.partnerAppliedGrade || app.partnerInfo?.level || grade}</span>
                                            <span style={{ color: '#8E8E93', textAlign: 'right' }}>{app.partnerInfo?.tshirtSize || '-'}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button style={{ background: '#F2F2F7', border: 'none', color: '#8E8E93', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>관리</button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
