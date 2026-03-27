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
            {/* Tournament Type Selection (Card Style) */}
            <div className="input-group">
                <label className="input-label">대회 구분</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Local Option */}
                    <div 
                        onClick={() => setFormData({ ...formData, regionType: 'local' })}
                        style={{
                            padding: '20px',
                            borderRadius: '16px',
                            border: formData.regionType === 'local' ? '2px solid #000' : '1px solid #E5E5EA',
                            background: formData.regionType === 'local' ? '#F9F9F9' : '#fff',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1C1C1E', marginBottom: '6px' }}>시구군 지역 대회</h4>
                            <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: '1.6', margin: 0 }}>
                                각 지자체 배드민턴협회에서 주최하는 대회로 해당 지역 급수를 기준으로 참가 기준이 정해집니다.<br />
                                <span style={{ color: '#FF6B3D', fontWeight: 600 }}>플레이어의 급수보다 낮은 급수로 신청이 불가합니다.</span>
                            </p>
                        </div>
                        <div style={{ 
                            width: '24px', height: '24px', borderRadius: '50%', 
                            border: formData.regionType === 'local' ? '7px solid #000' : '2px solid #E5E5EA',
                            flexShrink: 0, marginTop: '2px', transition: 'all 0.2s'
                        }} />
                    </div>

                    {/* National Option */}
                    <div 
                        onClick={() => setFormData({ ...formData, regionType: 'national' })}
                        style={{
                            padding: '20px',
                            borderRadius: '16px',
                            border: formData.regionType === 'national' ? '2px solid #000' : '1px solid #E5E5EA',
                            background: formData.regionType === 'national' ? '#F9F9F9' : '#fff',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1C1C1E', marginBottom: '6px' }}>전국 사설 대회</h4>
                            <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: '1.6', margin: 0 }}>
                                지역 급수와 상관없이 종목 지원이 가능한 대회입니다.<br />
                                급수 기준은 적용되지 않으며, 플레이어 카드에서도 급수를 보여지지 않습니다.
                            </p>
                        </div>
                        <div style={{ 
                            width: '24px', height: '24px', borderRadius: '50%', 
                            border: formData.regionType === 'national' ? '7px solid #000' : '2px solid #E5E5EA',
                            flexShrink: 0, marginTop: '2px', transition: 'all 0.2s'
                        }} />
                    </div>
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

            {/* Poster and Syllabus/Guideline Upload */}
            <div className="input-group" style={{ marginTop: '0' }}>
                <label className="input-label">대회 포스터 및 요강</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Poster Upload */}
                    <div 
                        className="inline-item" 
                        style={{ height: '48px', cursor: 'pointer', position: 'relative' }}
                    >
                        <Icon name="gallery" size={18} color="#FF6B3D" />
                        <span style={{ fontSize: '14px', color: (formData.poster) ? '#1C1C1E' : '#C7C7CC', fontWeight: formData.poster ? 700 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {formData.poster instanceof File 
                                ? formData.poster.name 
                                : (typeof formData.poster === 'string' && formData.poster.startsWith('http'))
                                    ? "대회 포스터 이미지가 등록됨" 
                                    : "대회 포스터 이미지 선택(JPG, PNG)"}
                        </span>
                        <input 
                            type="file" 
                            accept="image/*"
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setFormData({ ...formData, poster: file });
                            }}
                        />
                    </div>

                    {/* Guideline / Syllabus Upload */}
                    <div 
                        className="inline-item" 
                        style={{ height: '48px', cursor: 'pointer', position: 'relative' }}
                    >
                        <Icon name="document" size={18} color="#34C759" />
                        <span style={{ fontSize: '14px', color: (formData.guideline) ? '#1C1C1E' : '#C7C7CC', fontWeight: formData.guideline ? 700 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {formData.guideline instanceof File 
                                ? formData.guideline.name 
                                : (typeof formData.guideline === 'string' && formData.guideline.startsWith('http'))
                                    ? "대회 요강 파일이 등록됨" 
                                    : "대회 요강 파일 선택(PDF, DOCX 등)"}
                        </span>
                        <input 
                            type="file" 
                            accept=".pdf,.doc,.docx,.hwp,.txt"
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setFormData({ ...formData, guideline: file });
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

