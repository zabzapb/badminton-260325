/**
 * Component: TournamentJoinedCard
 * 플레이어가 참가 신청한 대회 정보를 보여주는 카드 (대시보드용)
 */
import "./TournamentStatusCard.css";
import { TournamentEntryInfo } from "./TournamentStatusCard";

export interface TournamentJoinedCardProps {
    id: string;
    name: string;
    eventDate: string;
    venue: string;
    entryInfo: TournamentEntryInfo;
    playerImages?: string[];
    onClick?: () => void;
    className?: string;
    bgColor?: string;
    totalTeams?: number;
    totalPlayers?: number;
    malePlayers?: number;
    femalePlayers?: number;
}

export function TournamentJoinedCard({
    id,
    name,
    eventDate,
    venue,
    entryInfo,
    playerImages = [],
    onClick,
    className = "",
    bgColor,
    totalTeams = 0,
    totalPlayers = 0,
    malePlayers = 0,
    femalePlayers = 0,
}: TournamentJoinedCardProps) {
    return (
        <article
            className={`tournament-status-card tournament-status-card--joined ${className}`}
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
                    <div className="tournament-status-card__stats">
                        참가팀 {totalTeams}팀, 참가인원 총 {totalPlayers}명 남 {malePlayers}명, 여 {femalePlayers}명
                    </div>
                    <div className="tournament-status-card__entry-container">
                        <div className="tournament-status-card__entry-summary">
                            {entryInfo?.eventType || "종목 미정"} {entryInfo?.ageGroup || ""} {entryInfo?.level || ""}
                        </div>
                        {(entryInfo && (entryInfo.applicant || entryInfo.teamStats)) && (
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
                </div>

                <div className="tournament-status-card__side-action">
                    {playerImages.length > 0 && (
                        <div className="player-avatars-overlap">
                            {playerImages.map((img, i) => (
                                <div key={i} className="avatar-circle" style={{ zIndex: playerImages.length - i }}>
                                    <img src={img || "/default-avatar.png"} alt="player" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
