/**
 * Component: TournamentManageCard
 * 대회 목록 및 관리에서 사용하는 '대회관리카드'
 */
import "./TournamentStatusCard.css";
import { TournamentStatus, getTournamentTimeInfo } from "./TournamentStatusCard";

export interface TournamentManageCardProps {
    id: string;
    name: string;
    eventDate: string;
    deadline?: string;
    venue: string;
    status: TournamentStatus;
    onClick?: () => void;
    className?: string;
    bgColor?: string;
    totalTeams?: number;
    totalPlayers?: number;
    malePlayers?: number;
    femalePlayers?: number;
    mdCount?: number;
    wdCount?: number;
    xdCount?: number;
    sCount?: number;
}

export function TournamentManageCard({
    id,
    name,
    eventDate,
    deadline,
    venue,
    status,
    onClick,
    className = "",
    bgColor,
    totalTeams = 0,
    totalPlayers = 0,
    malePlayers = 0,
    femalePlayers = 0,
    mdCount = 0,
    wdCount = 0,
    xdCount = 0,
    sCount = 0,
}: TournamentManageCardProps) {
    const { dday, deadline: formattedDeadline } = getTournamentTimeInfo(eventDate, deadline);
    const isFinished = status === "finished";

    return (
        <article
            className={`tournament-status-card tournament-status-card--manage ${isFinished ? 'is-finished' : ''} ${className}`}
            style={bgColor ? { backgroundColor: bgColor } : {}}
            onClick={onClick}
        >
            <div className="tournament-status-card__content" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                <h3 className="tournament-status-card__name" style={{ width: '100%', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px', color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{name}</h3>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="tournament-status-card__info-group" style={{ gap: '6px' }}>
                        <div className="tournament-status-card__sub-info" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginTop: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="info-date" style={{ color: isFinished ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.8)', fontSize: '15px' }}>{eventDate}</span>
                                <span className="info-deadline" style={{ fontSize: '14px', fontWeight: '800', color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{formattedDeadline}</span>
                            </div>
                            <span className="info-venue" style={{ fontSize: '13px', color: isFinished ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.6)' }}>{venue}</span>
                        </div>
                        <div className="tournament-status-card__stats" style={{ marginTop: '12px', fontSize: '13px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px' }}>
                            <div style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: isFinished ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.5)', fontWeight: 400 }}>Total</span>
                                <strong style={{ fontWeight: 800, fontSize: '14px', color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{totalTeams}</strong>
                                <span style={{ color: isFinished ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)', fontWeight: 400 }}>team</span>
                                <span style={{ color: isFinished ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)', fontWeight: 400 }}>
                                    (<strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{totalPlayers}</strong>명)
                                </span>
                                <span style={{ opacity: 0.2, margin: '0 0 0 8px' }}>|</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px', color: isFinished ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)' }}>
                                <div style={{ whiteSpace: 'nowrap' }}>MD <strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{mdCount}</strong></div>
                                <span style={{ opacity: 0.15 }}>|</span>
                                <div style={{ whiteSpace: 'nowrap' }}>WD <strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{wdCount}</strong></div>
                                <span style={{ opacity: 0.15 }}>|</span>
                                <div style={{ whiteSpace: 'nowrap' }}>XD <strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{xdCount}</strong></div>
                                <span style={{ opacity: 0.15 }}>|</span>
                                <div style={{ whiteSpace: 'nowrap' }}>S <strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{sCount}</strong></div>
                            </div>
                        </div>
                    </div>

                    <div className="tournament-status-card__side-action" style={{ padding: '4px 0' }}>
                        <div className="status-text-label">
                            {status === "open" && (
                                <div className="status-open-group">
                                    <span className="label-open-dday" style={{ fontSize: '24px', fontWeight: 900, color: '#000' }}>{dday}</span>
                                </div>
                            )}
                            {status === "closed" && <span className="label-closed" style={{ fontSize: '15px', fontWeight: 700 }}>마감</span>}
                            {status === "finished" && <span className="label-finished" style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(0,0,0,0.4)' }}>종료</span>}
                            {status === "registered" && <span className="label-registered" style={{ fontSize: '15px', fontWeight: 700 }}>접수 중</span>}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
