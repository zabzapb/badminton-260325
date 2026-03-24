import { Icon } from "@/components/ui/Icon";

interface Props {
    apps: any[];
    fetchingApps: boolean;
    onDownloadExcel: () => void;
}

export function ApplicantManagement({ apps, fetchingApps, onDownloadExcel }: Props) {
    return (
        <div className="applicants-management" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', color: '#8E8E93', background: '#F2F2F7', padding: '12px 20px', borderRadius: '12px', fontWeight: 600 }}>
                    [신청 현황] {apps.length} 팀 접수 완료
                </div>
                <button className="btn-excel-download" style={{ background: '#000', color: '#fff', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={onDownloadExcel}>
                    <Icon name="document" size={16} color="#fff" /> Excel 다운로드
                </button>
            </div>
            <div className="applicant-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {fetchingApps ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#8E8E93' }}>신청자 목록을 불러오는 중...</div>
                ) : apps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8E8E93', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', border: '1px dashed #E5E5EA' }}>현재 신청한 팀이 없습니다.</div>
                ) : (
                    apps.map((app: any) => (
                        <div key={app.id} style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #E5E5EA', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B3D', background: 'rgba(255,107,61,0.1)', padding: '4px 8px', borderRadius: '6px' }}>{app.category}</span>
                                <span style={{ fontSize: '12px', color: '#8E8E93' }}>{app.group}</span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1C1C1E', marginBottom: '4px' }}>
                                {app.realName || app.userName} {app.partnerName ? `& ${app.partnerName}` : ''}
                            </div>
                            <div style={{ fontSize: '13px', color: '#8E8E93' }}>
                                {app.phone} {app.partnerPhone ? `/ ${app.partnerPhone}` : ''}
                            </div>
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F2F2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: app.status === 'confirmed' ? '#34C759' : '#FF6B3D', fontWeight: 700 }}>
                                    {app.status === 'confirmed' ? '입금 확인' : '대기 중'}
                                </span>
                                <button style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>상세 보기</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
