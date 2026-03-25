import React from "react";
import { Icon } from "@/components/ui/Icon";
import { formatNumber } from "@/utils/tournamentUtils";

interface props {
    formData: any;
    setFormData: any;
    setPickingDateType: any;
    displayEventDates: string;
    displayDeadline: string;
}

export const TournamentOverviewSection: React.FC<props> = ({
    formData, setFormData, setPickingDateType, displayEventDates, displayDeadline
}) => {
    return (
        <div className="tournament-overview-section" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Region Type Selection */}
            <div className="input-group">
                <label className="input-label">대회 구분</label>
                <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: '16px', padding: '6px', gap: '4px' }}>
                    <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, regionType: 'local' })} 
                        style={{ 
                            flex: 1, height: '44px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', 
                            background: formData.regionType === 'local' ? '#000' : 'transparent', 
                            color: formData.regionType === 'local' ? '#fff' : '#8E8E93',
                            transition: 'all 0.2s'
                        }}
                    >
                        시·구·군 (로컬)
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, regionType: 'national' })} 
                        style={{ 
                            flex: 1, height: '44px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', 
                            background: formData.regionType === 'national' ? '#000' : 'transparent', 
                            color: formData.regionType === 'national' ? '#fff' : '#8E8E93',
                            transition: 'all 0.2s'
                        }}
                    >
                        전국 대회
                    </button>
                </div>
            </div>

            {/* Schedule Management */}
            <div className="input-group">
                <label className="input-label">대회 일정 관리</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="inline-item" onClick={() => setPickingDateType("eventDates")} style={{ cursor: 'pointer', height: '48px' }}>
                        <Icon name="calendar" size={18} color="#FF6B3D" />
                        <span style={{ fontWeight: 500, flex: 1 }}>{displayEventDates || "대회 일정 선택"}</span>
                    </div>
                    <div className="inline-item" onClick={() => setPickingDateType("deadline")} style={{ cursor: 'pointer', height: '48px' }}>
                        <Icon name="calendar" size={18} color="#34C759" />
                        <span style={{ fontWeight: 500, flex: 1 }}>{displayDeadline || "접수 마감일 선택"}</span>
                    </div>
                </div>
            </div>

            {/* Venue and Account */}
            <div className="input-group">
                <label className="input-label">대회 장소 (체육관명)</label>
                <div className="inline-item">
                    <Icon name="search" size={18} color="#C7C7CC" />
                    <input 
                        className="input-field" 
                        placeholder="예: 마곡실내배드민턴장"
                        value={formData.venue || ""} 
                        onChange={e => setFormData({ ...formData, venue: e.target.value })} 
                        style={{ border: 'none', padding: 0 }}
                    />
                </div>
            </div>

            {/* Entrance Fees */}
            <div className="input-group">
                <label className="input-label">대회 참가비</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="inline-item">
                        <span style={{ fontSize: '14px', color: '#8E8E93', minWidth: '100px', fontWeight: 500 }}>복식 (팀 기준)</span>
                        <input 
                            className="input-field" 
                            placeholder="0"
                            value={formatNumber(String(formData.feeDoubles || ""))} 
                            onChange={e => setFormData({ ...formData, feeDoubles: e.target.value.replace(/[^0-9]/g, "") })} 
                            style={{ border: 'none', padding: 0, textAlign: 'right', flex: 1 }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 700, marginLeft: '8px' }}>원</span>
                    </div>
                    <div className="inline-item">
                        <span style={{ fontSize: '14px', color: '#8E8E93', minWidth: '100px', fontWeight: 500 }}>단식 (1인)</span>
                        <input 
                            className="input-field" 
                            placeholder="0"
                            value={formatNumber(String(formData.feeSingles || ""))} 
                            onChange={e => setFormData({ ...formData, feeSingles: e.target.value.replace(/[^0-9]/g, "") })} 
                            style={{ border: 'none', padding: 0, textAlign: 'right', flex: 1 }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 700, marginLeft: '8px' }}>원</span>
                    </div>
                </div>
            </div>

            {/* Deposit Account Info */}
            <div className="input-group">
                <label className="input-label">입금 계좌 정보</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="inline-item" style={{ height: '48px' }}>
                        <Icon name="info" size={18} color="#C7C7CC" />
                        <input 
                            className="input-field" 
                            placeholder="은행명 (예: 국민은행)"
                            value={formData.account?.bank || ""} 
                            onChange={e => setFormData({ 
                                ...formData, 
                                account: { ...formData.account, bank: e.target.value } 
                            })} 
                            style={{ border: 'none', padding: 0 }}
                        />
                    </div>
                    <div className="inline-item" style={{ height: '48px' }}>
                        <Icon name="info" size={18} color="#C7C7CC" />
                        <input 
                            className="input-field" 
                            placeholder="계좌번호 (숫자만 입력)"
                            value={formData.account?.accountNumber || ""} 
                            onChange={e => setFormData({ 
                                ...formData, 
                                account: { ...formData.account, accountNumber: e.target.value } 
                            })} 
                            style={{ border: 'none', padding: 0 }}
                        />
                    </div>
                    <div className="inline-item" style={{ height: '48px' }}>
                        <Icon name="info" size={18} color="#C7C7CC" />
                        <input 
                            className="input-field" 
                            placeholder="예금주"
                            value={formData.account?.owner || ""} 
                            onChange={e => setFormData({ 
                                ...formData, 
                                account: { ...formData.account, owner: e.target.value } 
                            })} 
                            style={{ border: 'none', padding: 0 }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

