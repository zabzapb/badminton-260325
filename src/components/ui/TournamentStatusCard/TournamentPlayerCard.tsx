/**
 * Component: TournamentPlayerCard
 * 대시보드(Dashboard)에서 사용하는 '대회신청카드'
 */
import React from "react";
import "./TournamentStatusCard.css";
import { TournamentStatus, getTournamentTimeInfo } from "./TournamentStatusCard";

export interface TournamentPlayerCardProps {
    id: string;
    name: string;
    eventDate: string;
    deadline?: string;
    venue: string;
    status: TournamentStatus;
    isJoined?: boolean;
    isPaid?: boolean; // 입금 완료 여부
    // 신청 정보 (신청 시)
    joinedEvents?: Array<{
        type: string;
        ageGroup: string;
        level: string;
    }>;
    partnerImages?: string[];
    isPartner?: boolean; // 신청자가 아닌 파트너로서 참여 중인지 여부
    // 통계 정보 (공통)
    totalTeams?: number;
    totalApplicants?: number;
    teamStats?: {
        md: number;
        wd: number;
        xd: number;
        s: number;
    };
    bgColor?: string;
    onClick?: () => void;
    onApply?: () => void;
    onLeave?: (e: React.MouseEvent) => void;
    className?: string;
}

export function TournamentPlayerCard({
    id,
    name,
    eventDate,
    deadline,
    venue,
    status,
    isJoined = false,
    isPaid = false,
    joinedEvents = [],
    partnerImages = [],
    isPartner = false,
    totalTeams = 0,
    totalApplicants = 0,
    teamStats = { md: 0, wd: 0, xd: 0, s: 0 },
    bgColor,
    onClick,
    onApply,
    onLeave,
    className = "",
}: TournamentPlayerCardProps) {
    const { dday, deadline: formattedDeadline, deadlineUrgentText } = getTournamentTimeInfo(eventDate, deadline);
    const isFinished = status === "finished";

    return (
        <article
            className={`tournament-status-card tournament-status-card--player ${isJoined ? 'is-joined' : ''} ${isPartner ? 'is-partner-view' : ''} ${isFinished ? 'is-finished' : ''} ${className}`}
            style={bgColor ? { backgroundColor: bgColor, border: "none" } : {}}
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
                    ) : isJoined ? (
                        isPaid ? (
                            <span style={{ background: 'rgba(52, 199, 89, 0.12)', color: '#28A745', fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                                입금 완료
                            </span>
                        ) : (
                            <span style={{ background: 'rgba(255, 149, 0, 0.12)', color: '#FF9500', fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                                입금 대기 중
                            </span>
                        )
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

                {/* 5. 액션 영역 (신청 전: 참가 신청 | 접수 마감 N일 전, 신청 후: 신청종목 + 파트너 캐릭터) */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    {isJoined ? (
                        <>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px', fontSize: '15px', fontWeight: '800', color: isFinished ? 'rgba(0,0,0,0.5)' : '#000' }}>
                                {joinedEvents.map((ev: any, i) => (
                                    <span key={i} style={{ 
                                        color: isFinished ? 'rgba(0,0,0,0.5)' : (ev.isPending ? '#8E8E93' : '#000'),
                                        fontSize: ev.isPending ? '14px' : '15px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {ev.type} {ev.ageGroup} {ev.level}
                                        {ev.isPending && <span style={{ fontSize: '10px', marginLeft: '4px', verticalAlign: 'middle', fontWeight: 500 }}>(승인대기)</span>}
                                    </span>
                                ))}

                                {isPartner && (
                                    <span style={{ fontSize: '11px', color: isFinished ? 'rgba(0,0,0,0.4)' : '#666', fontWeight: '400', width: '100%', marginTop: '2px' }}>
                                        (파트너로 초대됨)
                                    </span>
                                )}
                            </div>
                            {partnerImages.length > 0 && (
                                <div className="player-avatars-overlap" style={{ opacity: isFinished ? 0.6 : 1 }}>
                                    {partnerImages.map((img, i) => (
                                        <div key={i} className="avatar-circle" style={{ zIndex: partnerImages.length - i }}>
                                            <img src={img || "/profile_sample.png"} alt="partner" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <button 
                                className="btn-apply-small"
                                onClick={(e) => { e.stopPropagation(); onApply?.(); }}
                                disabled={status !== 'open'}
                                style={{ 
                                    padding: '8px 22px', 
                                    background: status === 'open' ? '#EC683E' : 'rgba(0,0,0,0.12)', 
                                    color: status === 'open' ? '#fff' : 'rgba(0,0,0,0.4)', 
                                    border: 'none', 
                                    borderRadius: '50px', 
                                    fontSize: '13px', 
                                    fontWeight: '800',
                                    cursor: status === 'open' ? 'pointer' : 'default',
                                    boxShadow: 'none'
                                }}
                            >
                                {status === 'open' ? '참가 신청' : status === 'closed' ? '접수 마감' : '대회 종료'}
                            </button>
                            
                            {status === 'open' && (
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#EC683E' }}>
                                    {deadlineUrgentText || dday}
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* 6. 참가자 현황 (상단 구분선 추가) */}
                <div className="tournament-status-card__stats" style={{ width: '100%', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px', color: isFinished ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.5)' }}>
                    <div style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 400 }}>Total</span>
                        <strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000', fontSize: '13px' }}>{totalTeams}</strong>
                        <span style={{ color: isFinished ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)', fontWeight: 400 }}>team</span>
                        <span style={{ color: isFinished ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)', fontWeight: 400 }}>
                            (<strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{totalApplicants}</strong>명)
                        </span>
                        <span style={{ opacity: 0.2, margin: '0 0 0 4px' }}>|</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
                        <div style={{ whiteSpace: 'nowrap' }}>MD <strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{teamStats.md}</strong></div>
                        <span style={{ opacity: 0.15 }}>|</span>
                        <div style={{ whiteSpace: 'nowrap' }}>WD <strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{teamStats.wd}</strong></div>
                        <span style={{ opacity: 0.15 }}>|</span>
                        <div style={{ whiteSpace: 'nowrap' }}>XD <strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{teamStats.xd}</strong></div>
                        <span style={{ opacity: 0.15 }}>|</span>
                        <div style={{ whiteSpace: 'nowrap' }}>S <strong style={{ fontWeight: 800, color: isFinished ? 'rgba(0,0,0,0.45)' : '#000' }}>{teamStats.s}</strong></div>
                    </div>
                </div>

            </div>

        </article>
    );
}
