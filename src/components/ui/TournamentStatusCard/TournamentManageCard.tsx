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
    const { dday, deadline: formattedDeadline, deadlineUrgentText } = getTournamentTimeInfo(eventDate, deadline);
    const isFinished = status === "finished";

    return (
        <article
            className={`tournament-status-card tournament-status-card--manage ${isFinished ? 'is-finished' : ''} ${className}`}
            style={bgColor ? { backgroundColor: bgColor } : {}}
            onClick={onClick}
        >
            <div className="tournament-status-card__content" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px', width: '100%' }}>
                
                {/* 1. D-Day 및 별도 상태 뱃지 (1단) */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: isFinished ? 'rgba(0,0,0,0.4)' : '#1C1C1E' }}>
                        {dday || 'D-Day'}
                    </span>

                    {isFinished ? (
                        <span style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'rgba(0, 0, 0, 0.4)', fontSize: '12px', fontWeight: 500, padding: '3px 10px', borderRadius: '12px' }}>
                            대회 종료
                        </span>
                    ) : status === "closed" ? (
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
                    {name}
                </h3>

                {/* 3. 날짜 및 장소 */}
                <div className="tournament-status-card__sub-info" style={{ color: isFinished ? 'rgba(0,0,0,0.4)' : undefined, fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                    <span className="info-date">{eventDate}</span>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <span className="info-venue">{venue}</span>
                </div>

                {/* 4. 마감일 표기 */}
                {formattedDeadline && (
                    <div style={{ fontSize: '12px', color: isFinished ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.5)', fontWeight: 500, marginTop: '1px' }}>
                        {formattedDeadline}
                    </div>
                )}

                {/* 5. 액션/상태 영역 (대회 관리) */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#EC683E' }}>
                        대회 정보 관리 ➔
                    </span>
                    
                    {status === 'open' && (
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#EC683E' }}>
                            {deadlineUrgentText || dday}
                        </span>
                    )}
                </div>

                {/* 6. 참가자 현황 (상단 구분선 추가) */}
                <div className="tournament-status-card__stats" style={{ width: '100%', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px', color: isFinished ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.5)' }}>
                    <div style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 400 }}>Total</span>
                        <strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000', fontSize: '13px' }}>{totalTeams}</strong>
                        <span style={{ color: isFinished ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)', fontWeight: 400 }}>team</span>
                        <span style={{ color: isFinished ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)', fontWeight: 400 }}>
                            (<strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{totalPlayers}</strong>명)
                        </span>
                        <span style={{ opacity: 0.2, margin: '0 0 0 4px' }}>|</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
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
        </article>
    );
}
