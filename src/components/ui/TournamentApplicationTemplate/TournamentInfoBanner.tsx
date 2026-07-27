import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Tournament } from "@/lib/types";
import { getTournamentColor } from "@/utils/tournamentRules";

interface TournamentInfoBannerProps {
    tournament: Tournament;
    displayEventDate: string;
    dDayStr: string;
    formattedDeadline: string;
    stats: { total: number; md: number; wd: number; xd: number; s: number };
    selectedCategory: string | null;
    handleCopy: () => void;
}

export const TournamentInfoBanner: React.FC<TournamentInfoBannerProps> = ({
    tournament, displayEventDate, dDayStr, formattedDeadline, stats, selectedCategory, handleCopy
}) => {
    const bgColor = getTournamentColor(tournament.id || "");
    const tObj = tournament as any;
    const now = new Date();
    const tDeadline = tObj?.deadline ? new Date(tObj.deadline + "T23:59:59") : null;
    const eventDates: string[] = tObj?.eventDates || [];
    const lastDateStr = eventDates.length > 0 
        ? eventDates[eventDates.length - 1] 
        : tObj?.eventDate;
    const tEndDate = lastDateStr ? new Date(lastDateStr + "T23:59:59") : null;

    const isFinished = (tEndDate && now > tEndDate) || (tObj?.status as string) === "finished";
    const isClosed = (tDeadline && now > tDeadline) || (tObj?.status as string) === "closed";

    // safe number parsing
    const parseAmount = (val: any) => {
        if (typeof val === 'number') return val;
        return parseInt(String(val || "0").replace(/[^0-9]/g, '')) || 0;
    };

    // Fee logic
    const renderFees = () => {
        const feeItems = [];
        
        if (tournament.feeDoubles) {
            feeItems.push(
                <span key="doubles">
                    복식 {parseAmount(tournament.feeDoubles).toLocaleString()}원
                    <span style={{ fontWeight: 400, marginLeft: '2px' }}>(팀)</span>
                </span>
            );
        }
        
        if (tournament.feeSingles) {
            feeItems.push(
                <span key="singles">
                    단식 {parseAmount(tournament.feeSingles).toLocaleString()}원
                </span>
            );
        }

        if (feeItems.length === 0 && tournament.fee) {
            return <span>참가비 {parseAmount(tournament.fee).toLocaleString()}원</span>;
        }

        return feeItems.reduce((prev: any, curr: any) => (
            <React.Fragment key={Math.random()}>
                {prev}
                <span style={{ margin: '0 10px', opacity: 0.15, fontWeight: 400 }}>|</span>
                {curr}
            </React.Fragment>
        ));
    };

    return (
        <article className="tournament-status-card" style={{ backgroundColor: bgColor, marginBottom: '32px', cursor: 'default', transform: 'none', border: 'none', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', height: 'auto', borderRadius: '16px' }}>
            <div className="tournament-status-card__content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', width: '100%' }}>
                
                {/* 1. D-Day 및 별도 상태 뱃지 (1단) */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: isFinished ? 'rgba(0,0,0,0.4)' : '#1C1C1E' }}>
                        {dDayStr || 'D-Day'}
                    </span>

                    {isFinished ? (
                        <span style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'rgba(0, 0, 0, 0.4)', fontSize: '12px', fontWeight: 500, padding: '3px 10px', borderRadius: '12px' }}>
                            대회 종료
                        </span>
                    ) : isClosed ? (
                        <span style={{ background: 'rgba(0, 0, 0, 0.06)', color: 'rgba(0, 0, 0, 0.6)', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>
                            접수 마감
                        </span>
                    ) : (
                        <span style={{ background: 'rgba(236, 104, 62, 0.12)', color: '#EC683E', fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                            접수 중
                        </span>
                    )}
                </div>

                {/* 2. 대회명 (전폭 100% 한 줄 가독성 보장) */}
                <h3 className="tournament-status-card__name" style={{ width: '100%', fontSize: '18px', fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#1C1C1E', margin: '4px 0 2px 0', lineHeight: '1.3' }}>
                    {tournament.name}
                </h3>

                {/* 3. 날짜 및 장소 */}
                <div className="tournament-status-card__sub-info" style={{ color: isFinished ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.8)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                    <span className="info-date">{displayEventDate}</span>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <span className="info-venue">{tournament.venue}</span>
                </div>

                {/* 4. 마감일 표기 */}
                {formattedDeadline && (
                    <div style={{ fontSize: '12px', color: isFinished ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.5)', fontWeight: 500, marginTop: '1px' }}>
                        {formattedDeadline.startsWith('접수 마감') || formattedDeadline.startsWith('접수마감') ? formattedDeadline : `접수 마감 ${formattedDeadline}`}
                    </div>
                )}

                {/* 5. 참가자 현황 (상단 구분선 추가) */}
                <div className="stats-info" style={{ width: '100%', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '12px', color: 'rgba(0,0,0,0.5)', fontWeight: '400', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px' }}>
                    <div style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 400 }}>Total</span>
                        <strong style={{ fontWeight: 800, color: '#000', fontSize: '13px' }}>{stats.s + stats.md + stats.wd + stats.xd}</strong>
                        <span style={{ color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>team</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>
                            (<strong style={{ fontWeight: 800, color: '#000' }}>{stats.total}</strong>명)
                        </span>
                        <span style={{ opacity: 0.2, margin: '0 0 0 4px' }}>|</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
                        <div style={{ whiteSpace: 'nowrap' }}>MD <strong style={{ fontWeight: 800, color: '#000' }}>{stats.md}</strong></div>
                        <span style={{ opacity: 0.15 }}>|</span>
                        <div style={{ whiteSpace: 'nowrap' }}>WD <strong style={{ fontWeight: 800, color: '#000' }}>{stats.wd}</strong></div>
                        <span style={{ opacity: 0.15 }}>|</span>
                        <div style={{ whiteSpace: 'nowrap' }}>XD <strong style={{ fontWeight: 800, color: '#000' }}>{stats.xd}</strong></div>
                        <span style={{ opacity: 0.15 }}>|</span>
                        <div style={{ whiteSpace: 'nowrap' }}>S <strong style={{ fontWeight: 800, color: '#000' }}>{stats.s}</strong></div>
                    </div>
                </div>

                <div style={{ width: '100%', height: '1px', background: 'rgba(0,0,0,0.06)' }} />

                <div className="tournament-status-card-footer" style={{ width: '100%', paddingBottom: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#000' }}>
                           {renderFees()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(0,0,0,0.7)', fontWeight: '500' }}>
                            <span>{tournament.account?.bank} {tournament.account?.accountNumber} 예금주: {tournament.account?.owner}</span>
                            <button type="button" onClick={handleCopy} style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="계좌정보 복사">
                                <Icon name="copy" size={14} color="#000" />
                            </button>
                        </div>
                        {tournament.guideline && typeof tournament.guideline === 'string' && (tournament.guideline.startsWith('http') || tournament.guideline.startsWith('data:')) && (
                            <div style={{ marginTop: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const fileUrl = tournament.guideline;
                                        if (!fileUrl) return;
                                        const fileName = tournament.guidelineName || `${tournament.name}_대회요강`;

                                        if (fileUrl.startsWith('data:')) {
                                            try {
                                                const parts = fileUrl.split(';base64,');
                                                const contentType = parts[0].replace('data:', '') || 'application/octet-stream';
                                                const base64Data = parts[1];
                                                
                                                if (base64Data) {
                                                    const binaryStr = window.atob(base64Data);
                                                    const len = binaryStr.length;
                                                    const bytes = new Uint8Array(len);
                                                    for (let i = 0; i < len; i++) {
                                                        bytes[i] = binaryStr.charCodeAt(i);
                                                    }
                                                    const blob = new Blob([bytes], { type: contentType });
                                                    const blobUrl = URL.createObjectURL(blob);
                                                    
                                                    const link = document.createElement('a');
                                                    link.href = blobUrl;
                                                    const ext = contentType.includes('pdf') ? 'pdf' : (contentType.includes('word') || contentType.includes('officedocument')) ? 'docx' : 'file';
                                                    link.download = fileName.includes('.') ? fileName : `${fileName}.${ext}`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                                                    return;
                                                }
                                            } catch (err) {
                                                console.error("Data URL download error:", err);
                                            }
                                        }

                                        const link = document.createElement('a');
                                        link.href = fileUrl;
                                        link.target = '_blank';
                                        link.download = fileName;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '12px 24px',
                                        borderRadius: '10px',
                                        background: '#FF6B3D',
                                        color: '#fff',
                                        border: 'none',
                                        fontSize: '15px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        boxShadow: 'none'
                                    }}
                                >
                                    <Icon name="document" size={16} color="#fff" />
                                    <span>대회 요강 다운로드</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
};
