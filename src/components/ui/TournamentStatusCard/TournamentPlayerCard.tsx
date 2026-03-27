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
    const { dday, deadline: formattedDeadline } = getTournamentTimeInfo(eventDate, deadline);

    return (
        <article
            className={`tournament-status-card tournament-status-card--player ${isJoined ? 'is-joined' : ''} ${isPartner ? 'is-partner-view' : ''} ${className}`}
            style={bgColor ? { backgroundColor: bgColor, border: "none" } : {}}
            onClick={onClick}
        >
            <div className="tournament-status-card__content">
                <div className="tournament-status-card__info-group">
                    <h3 className="tournament-status-card__name">{name}</h3>
                    <div className="tournament-status-card__sub-info">
                        <span className="info-date">{eventDate}</span>
                        <span className="info-venue">{venue}</span>
                    </div>

                    <div className="tournament-status-card__entry-container" style={{ marginTop: '16px' }}>
                        {isJoined ? (
                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#000', lineHeight: '1.2' }}>
                                {joinedEvents.map((ev: any, i) => (
                                    <span key={i} style={{ 
                                        marginRight: i < joinedEvents.length - 1 ? '12px' : 0,
                                        color: ev.isPending ? '#8E8E93' : '#000',
                                        fontSize: ev.isPending ? '16px' : '18px'
                                    }}>
                                        {ev.type} {ev.ageGroup} {ev.level}
                                        {ev.isPending && <span style={{ fontSize: '10px', marginLeft: '4px', verticalAlign: 'middle', fontWeight: 500 }}>(승인대기)</span>}
                                    </span>
                                ))}

                                {isPartner && (
                                    <span style={{ fontSize: '12px', color: '#666', fontWeight: '400', display: 'block', marginTop: '4px' }}>
                                        (파트너로 초대됨)
                                    </span>
                                )}
                            </div>
                        ) : (
                            <button 
                                className="btn-apply-small"
                                onClick={(e) => { e.stopPropagation(); onApply?.(); }}
                                style={{ 
                                    width: 'fit-content',
                                    padding: '8px 20px', 
                                    background: '#EC683E', 
                                    color: '#fff', 
                                    border: 'none', 
                                    borderRadius: '50px', 
                                    fontSize: '13px', 
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(236, 104, 62, 0.2)'
                                }}
                            >
                                참가신청
                            </button>
                        )}

                        <div className="tournament-status-card__stats" style={{ marginTop: '12px', fontSize: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px', color: 'rgba(0,0,0,0.5)' }}>
                            <div style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontWeight: 400 }}>Total</span>
                                <strong style={{ fontWeight: 800, color: '#000', fontSize: '13px' }}>{totalTeams}</strong>
                                <span style={{ color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>team</span>
                                <span style={{ color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>
                                    (<strong style={{ fontWeight: 800, color: '#000' }}>{totalApplicants}</strong>명)
                                </span>
                                <span style={{ opacity: 0.2, margin: '0 0 0 4px' }}>|</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
                                <div style={{ whiteSpace: 'nowrap' }}>MD <strong style={{ fontWeight: 800, color: '#000' }}>{teamStats.md}</strong></div>
                                <span style={{ opacity: 0.15 }}>|</span>
                                <div style={{ whiteSpace: 'nowrap' }}>WD <strong style={{ fontWeight: 800, color: '#000' }}>{teamStats.wd}</strong></div>
                                <span style={{ opacity: 0.15 }}>|</span>
                                <div style={{ whiteSpace: 'nowrap' }}>XD <strong style={{ fontWeight: 800, color: '#000' }}>{teamStats.xd}</strong></div>
                                <span style={{ opacity: 0.15 }}>|</span>
                                <div style={{ whiteSpace: 'nowrap' }}>S <strong style={{ fontWeight: 800, color: '#000' }}>{teamStats.s}</strong></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="tournament-status-card__side-action" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {isJoined ? (
                        /* 신청 후: 파트너 아바타 */
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                            {partnerImages.length > 0 && (
                                <div className="player-avatars-overlap">
                                    {partnerImages.map((img, i) => (
                                        <div key={i} className="avatar-circle" style={{ zIndex: partnerImages.length - i }}>
                                            <img src={img || "/profile_sample.png"} alt="partner" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* 신청 전: D-Day & 마감일 / 접수마감 / 대회종료 */
                        <div className="status-open-group">
                            {status === "finished" ? (
                                <span style={{ fontSize: '16px', fontWeight: '900', color: 'rgba(0,0,0,0.4)' }}>대회 종료</span>
                            ) : status === "closed" ? (
                                <span style={{ fontSize: '16px', fontWeight: '900', color: 'rgba(0,0,0,0.4)' }}>접수 마감</span>
                            ) : (
                                <>
                                    <span className="label-open-dday" style={{ fontSize: '20px', fontWeight: '900' }}>{dday}</span>
                                    <span className="label-open-date" style={{ fontSize: '12px', opacity: 0.6 }}>{formattedDeadline}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </article>
    );
}
