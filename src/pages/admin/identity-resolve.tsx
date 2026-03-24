import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from "@/components/ui/AppHeader";
import { Icon } from "@/components/ui/Icon";
import { getAllUsers, saveUserProfile } from "@/lib/firebase/userService";
import { UserProfile } from "@/lib/types";
import { logAuditAction, auditActions } from '@/core/utils/auditLogger';
import { SyncStatusIndicator } from '@/components/admin/SyncStatusIndicator';
import "./identity-resolve.css";

export default function IdentityResolvePage() {
    const navigate = useNavigate();
    const [pendingList, setPendingList] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const all = await getAllUsers();
            const pending = all.filter(u => !!u.pendingLinkId);
            setPendingList(pending);
            setLoading(false);
        };
        fetch();
    }, []);

    const handleApprove = async (profile: UserProfile) => {
        const confirmed = window.confirm(`${profile.realName}님의 계정 통합(Link)을 승인하시겠습니까?`);
        if (!confirmed) return;

        const updated = { ...profile, pendingLinkId: undefined, isVerified: true };
        
        try {
            await saveUserProfile(updated);
            
            // [Safety] Audit Logging
            await logAuditAction({
                action: auditActions.IDENTITY_MERGE_APPROVED,
                operatorId: 'SYSTEM_ADMIN', // TODO: Get logged-in admin ID
                targetId: profile.id,
                before: profile,
                after: updated,
                timestamp: new Date().toISOString()
            });

            setPendingList(prev => prev.filter(p => p.id !== profile.id));
        } catch (err) {
            console.error('Approval failed:', err);
        }
    };

    if (loading) return <div className="app-page"><AppHeader /><div className="resolve-container">검토 대상 조회 중...</div></div>;

    return (
        <div className="app-page">
            <AppHeader />
            <div className="resolve-container">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <SyncStatusIndicator />
                </div>

                <header className="resolve-header">
                    <h2 className="resolve-title">Identity Resolution <span className="badge">OPERATIONAL</span></h2>
                    <p className="resolve-subtitle">동일 식별자(연락처/이메일) 기반 계정 통합 승인 검토</p>
                </header>

                {pendingList.length === 0 ? (
                    <div className="empty-state">
                        <Icon name="check-circle" size={48} color="#34C759" />
                        <p>검토 대기 중인 데이터가 없습니다.</p>
                    </div>
                ) : (
                    <div className="resolve-grid">
                        {pendingList.map(profile => (
                            <div key={profile.id} className="resolve-card">
                                <DiffView profile={profile} onApprove={() => handleApprove(profile)} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function DiffView({ profile, onApprove }: { profile: UserProfile, onApprove: () => void }) {
    // Mocking social data for diff display (in real app, this comes from a temp record)
    const socialData = {
        realName: profile.realName === '홍길동' ? '길동홍' : profile.realName,
        phone: profile.phone,
        gender: profile.gender
    };

    const isChanged = (key: keyof typeof socialData) => profile[key] !== socialData[key];

    return (
        <div className="diff-view">
            <div className="diff-content">
                <div className="diff-column">
                    <h4 className="column-label">EXISTING PROFILE</h4>
                    <div className="info-item"><label>성명:</label> <span>{profile.realName}</span></div>
                    <div className="info-item"><label>연락처:</label> <span>{profile.phone}</span></div>
                    <div className="info-item"><label>성별:</label> <span>{profile.gender}</span></div>
                </div>
                
                <div className="diff-divider"><Icon name="arrow-right" size={16} /></div>

                <div className="diff-column highlight">
                    <h4 className="column-label">NEW PROVIDER DATA</h4>
                    <div className={`info-item ${isChanged('realName') ? 'has-conflict' : ''}`}>
                        <label>성명:</label> <span>{socialData.realName}</span>
                    </div>
                    <div className={`info-item ${isChanged('phone') ? 'has-conflict' : ''}`}>
                        <label>연락처:</label> <span>{socialData.phone}</span>
                    </div>
                    <div className="info-divider" />
                    <div className="status-tag">CONFLICTING_IDENTITY</div>
                </div>
            </div>

            <footer className="diff-footer">
                <button className="btn-reject" onClick={() => {}}>IGNORE</button>
                <button className="btn-approve" onClick={onApprove}>APPROVE MERGE</button>
            </footer>
        </div>
    );
}
