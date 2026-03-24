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
        <article className="tournament-status-card" style={{ backgroundColor: bgColor, marginBottom: '32px', cursor: 'default', transform: 'none', border: 'none', padding: '32px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', height: 'auto', minHeight: '180px', borderRadius: '12px' }}>
            <div className="tournament-status-card__content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div className="tournament-status-card__info-group" style={{ flex: 1 }}>
                        <h3 className="tournament-status-card__name" style={{ fontSize: '20px', marginBottom: '8px' }}>{tournament.name}</h3>
                        <div className="tournament-status-card__sub-info" style={{ color: 'rgba(0,0,0,0.8)', fontSize: '13px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <span>{displayEventDate}</span>
                            <span style={{ display: 'flex', alignItems: 'center' }}><span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>{tournament.venue}</span>
                        </div>
                    </div>
                    <div className="tournament-status-card__side-action" style={{ textAlign: 'right' }}>
                        <div className="status-open-group" style={{ alignItems: 'flex-end' }}>
                            <span className="label-open-dday" style={{ fontSize: '24px', color: '#000', fontWeight: '900' }}>{dDayStr}</span>
                        </div>
                    </div>
                </div>

                <div 
                    className="deadline-info" 
                    style={{ 
                        width: '100%', fontSize: '12px', color: '#000', opacity: 0.6, 
                        fontWeight: '500'
                    }}
                >
                    접수마감 {formattedDeadline}
                </div>

                <div className="stats-info" style={{ width: '100%', fontSize: '12px', color: 'rgba(0,0,0,0.5)', fontWeight: '400', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px' }}>
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
                    </div>
                </div>
            </div>
        </article>
    );
};
