/**
 * Component: TournamentStatusCard
 * 대회 신청 시 사용하는 '대회신청카드' (Base)
 */
import React, { useState, useEffect } from "react";
import "./TournamentStatusCard.css";

export type TournamentStatus = "registered" | "open" | "closed" | "finished";

export interface TournamentEntryInfo {
    eventType: string;
    ageGroup: string;
    level: string;
    partnerName?: string;
    applicant?: string; // 신청자
    teamStats?: {
        md?: number;
        wd?: number;
        xd?: number;
        s?: number;
    };
}

export interface TournamentStatusCardProps {
    id: string;
    name: string;
    eventDate: string;
    deadline?: string;
    isDeadlineUrgent?: boolean;
    venue: string;
    entryFee?: string;
    status: TournamentStatus;
    entryInfo?: TournamentEntryInfo;
    playerImages?: string[]; // 신청 시 표시할 플레이어 이미지들
    bgColor?: string;
    totalTeams?: number;
    totalPlayers?: number;
    malePlayers?: number;
    femalePlayers?: number;
    onApply?: (id: string) => void;
    onEdit?: (id: string) => void;
    className?: string; // 추가
}

const STATUS_MODIFIER: Record<TournamentStatus, string> = {
    registered: "tournament-status-card--registered",
    open: "tournament-status-card--open",
    closed: "tournament-status-card--closed",
    finished: "tournament-status-card--finished",
};

export function getTournamentTimeInfo(eventDateStr: string, deadlineStr?: string) {
    let ddayText = "D-?";

    // 1. Calculate D-Day from eventDate (parse YYYY. MM. DD. format)
    if (eventDateStr) {
        const dateMatch = eventDateStr.match(/(\d{4})\.\s*(\d{2})\.\s*(\d{2})/);
        if (dateMatch) {
            const [, y, m, d] = dateMatch;
            const targetDate = new Date(`${y}-${m}-${d}`);
            const today = new Date();
            targetDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            const diffTime = targetDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            ddayText = diffDays === 0 ? "D-Day" : diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
        } else {
            // Try fallback for ISO date or YYYY-MM-DD
            const d = new Date(eventDateStr);
            if (!isNaN(d.getTime())) {
                const today = new Date();
                d.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                ddayText = diffDays === 0 ? "D-Day" : diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
            }
        }
    }

    // 2. Format deadline
    let deadlineText = "";
    if (deadlineStr) {
        const dDate = new Date(deadlineStr);
        const month = (dDate.getMonth() + 1).toString().padStart(2, '0');
        const day = dDate.getDate().toString().padStart(2, '0');
        deadlineText = `마감 ${month}.${day}.`;
    } else {
        deadlineText = "마감 미정";
    }

    return {
        dday: ddayText,
        deadline: deadlineText
    };
}

export function TournamentStatusCard({
    id,
    name,
    eventDate,
    deadline,
    venue,
    status,
    entryInfo,
    playerImages = [],
    bgColor,
    totalTeams = 0,
    totalPlayers = 0,
    malePlayers = 0,
    femalePlayers = 0,
    onApply,
    onEdit,
    onClick,
    className = "", // 기본값 빈 문자열
}: TournamentStatusCardProps & { onClick?: () => void }) {
    const { dday, deadline: formattedDeadline } = getTournamentTimeInfo(eventDate, deadline);

    return (
        <article
            className={`tournament-status-card ${STATUS_MODIFIER[status]} ${className}`}
            id={`tournament-card-${id}`}
            role="article"
            aria-label={`${name} 대회 카드`}
            style={bgColor ? { backgroundColor: bgColor, border: "none" } : {}}
            onClick={onClick} /* 카드 전체 클릭 허용 */
        >
            <div className="tournament-status-card__content">
                <div className="tournament-status-card__info-group">
                    <h3 className="tournament-status-card__name">{name}</h3>
                    <div className="tournament-status-card__sub-info">
                        <span className="info-date">{eventDate}</span>
                        <span className="info-venue">{venue}</span>
                    </div>
                    <div className="tournament-status-card__stats">
                        참가팀 {totalTeams}팀, 참가인원 총 {totalPlayers}명 남 {malePlayers}명, 여 {femalePlayers}명
                    </div>
                    {status === "registered" && entryInfo && (
                        <div className="tournament-status-card__entry-container">
                            <div className="tournament-status-card__entry-summary">
                                {entryInfo?.eventType || "종목 미정"} {entryInfo?.ageGroup || ""} {entryInfo?.level || ""}
                            </div>
                            {(entryInfo.applicant || entryInfo.teamStats) && (
                                <div className="tournament-status-card__entry-details">
                                    {entryInfo.applicant && (
                                        <span className="detail-item">Number of Applicants {entryInfo.applicant}</span>
                                    )}
                                    {entryInfo.teamStats && (
                                        <>
                                            {entryInfo.applicant && <span className="detail-sep"> | </span>}
                                            <span className="detail-item">
                                                Team MD {entryInfo.teamStats.md || 0} WD {entryInfo.teamStats.wd || 0} XD {entryInfo.teamStats.xd || 0} S {entryInfo.teamStats.s || 0}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="tournament-status-card__side-action">
                    {status === "registered" && playerImages.length > 0 ? (
                        <div className="player-avatars-overlap">
                            {playerImages.map((img, i) => (
                                <div key={i} className="avatar-circle" style={{ zIndex: playerImages.length - i }}>
                                    <img src={img || "/default-avatar.png"} alt="player" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="status-text-label">
                            {status === "open" && (
                                <div className="status-open-group">
                                    <span className="label-open-dday">{dday}</span>
                                    <span className="label-open-date" suppressHydrationWarning>
                                        {formattedDeadline || "..."}
                                    </span>
                                </div>
                            )}
                            {status === "closed" && <span className="label-closed">접수 마감</span>}
                            {status === "finished" && <span className="label-finished">대회 종료</span>}
                            {status === "registered" && playerImages.length === 0 && <span className="label-registered">신청 완료</span>}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
