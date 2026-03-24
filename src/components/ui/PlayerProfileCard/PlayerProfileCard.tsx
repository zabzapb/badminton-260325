import { Icon } from "@/components/ui/Icon";
import "./PlayerProfileCard.css";

import { UserProfile as PlayerProfile } from "@/lib/types";
export type { PlayerProfile };

/** 출전 연령대 자동 계산 */
function calcAgeGroup(birthYear: number): string {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    if (age < 30) return "20대";
    if (age < 40) return "30대";
    if (age < 45) return "40대";
    if (age < 50) return "45대";
    if (age < 55) return "50대";
    if (age < 60) return "55대";
    if (age < 65) return "60대";
    if (age < 70) return "65대";
    return "70대+";
}

function formatPhoneNumber(phone: string): string {
    if (!phone) return "";
    const clean = phone.replace(/[^0-9]/g, "");
    if (clean.length === 11) {
        return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
    }
    return phone;
}

export interface PlayerProfileCardProps {
    profile: PlayerProfile;
    onEditProfile?: () => void;
    onDelete?: () => void;
    onBadgeClick?: () => void;
    onAvatarClick?: () => void;
    variant?: "default" | "mini";
    theme?: "light" | "dark";
    style?: React.CSSProperties;
    statusLabel?: string;
    statusBadge?: string;
    isPending?: boolean;
    badgeColor?: string;
    isCircle?: boolean;
    showEntry?: boolean;
    showRoleBadge?: boolean; // [추가] 권한 등급 배지 노출 여부
}

export function PlayerProfileCard({ 
    profile, 
    onEditProfile, 
    onDelete, 
    onBadgeClick, 
    onAvatarClick, 
    variant = "default", 
    style, 
    theme = "dark", 
    statusLabel, 
    statusBadge, 
    isPending, 
    badgeColor, 
    isCircle,
    showEntry = false,
    showRoleBadge = false // 기본값 false
}: PlayerProfileCardProps) {
    if (!profile) return null;
    const realName = profile.realName || "이름 없음";
    const initial = realName.charAt(0);
    const isMini = variant === "mini";

    const isModified = !!(
        (profile.originalRealName && profile.realName?.trim() !== profile.originalRealName?.trim()) ||
        (profile.originalGender && profile.gender !== profile.originalGender) ||
        (profile.originalPhone && profile.phone?.replace(/[^0-9]/g, "") !== profile.originalPhone?.replace(/[^0-9]/g, ""))
    );

    return (
        <section
            className={`player-profile-card ${isMini ? "player-profile-card--mini" : ""} ${theme === 'light' ? 'light' : ''} ${isPending ? 'is-pending' : ''}`}
            id="player-profile-card"
            style={style}
        >
            <div className="player-profile-card__hero">
                <div 
                    className={`player-profile-card__avatar-container ${onAvatarClick ? 'is-clickable' : ''}`}
                    onClick={onAvatarClick}
                    style={onAvatarClick ? { cursor: 'pointer' } : {}}
                >
                    <div className="player-profile-card__avatar" aria-hidden="true">
                        {profile.avatarUrl
                            ? <img src={profile.avatarUrl} alt={`${profile.realName} 프로필`} />
                            : initial
                        }
                    </div>
                    {onAvatarClick ? (
                        <div className="player-profile-card__avatar-manager-badge" style={{ backgroundColor: '#fff', borderColor: '#C7C7CC' }}>
                            <Icon name="settings" size={18} color="#999" />
                        </div>
                    ) : (
                        isMini ? (
                            (statusBadge || onBadgeClick) && (
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (onBadgeClick) onBadgeClick();
                                        else onDelete?.(); 
                                    }}
                                    style={{ 
                                        position: 'absolute', bottom: '-4px', right: isCircle ? '-8px' : '-4px', 
                                        background: badgeColor || (isPending ? '#E5E5EA' : '#000'), 
                                        color: (badgeColor || !isPending) ? '#fff' : '#8E8E93', 
                                        border: '1px solid #fff', 
                                        borderRadius: isCircle ? '50%' : '8px', 
                                        padding: isCircle ? '0' : '2px 8px', 
                                        width: isCircle ? '24px' : 'auto',
                                        height: isCircle ? '24px' : 'auto',
                                        fontSize: '10px', fontWeight: 800,
                                        cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: isCircle ? 'center' : 'flex-start', gap: isCircle ? '0' : '4px'
                                    }}
                                >
                                    {statusBadge}
                                    {isCircle && <Icon name="close" size={14} color="#fff" />}
                                </button>
                            )
                        ) : null
                    )}
                </div>

                <div 
                    className="player-profile-card__identity"
                    onClick={onAvatarClick}
                >
                    <div className="player-profile-card__main-info-row">
                        {showRoleBadge && (
                            profile.isMaster ? (
                                <span className="master-tag">Master</span>
                            ) : profile.isManager ? (
                                <span className="manager-tag">Manager</span>
                            ) : !profile.isVerified ? (
                                <span className="guest-tag">Guest</span>
                            ) : (
                                <span className="player-tag">Player</span>
                            )
                        )}
                        <span className="info-text">
                            {profile.realName}
                            <span className="info-sep">|</span>
                            <span className="player-profile-phone-link">
                                {formatPhoneNumber(profile.phone)}
                            </span>
                        </span>
                        {profile.isVerified && (
                             <img src="/naver-logo-circle.png.png" alt="네이버 인증" className={`player-profile-card__naver-logo ${isModified ? 'player-profile-card__naver-logo--modified' : ''}`} />
                        )}
                    </div>
                </div>
            </div>

            <div className="player-profile-card__divider" />

            <div className="player-profile-card__stats" style={{ gridTemplateColumns: `repeat(${showEntry ? 4 : 3}, 1fr)` }}>
                <div className="player-profile-stat">
                    {(() => {
                        const by = profile.birthYear || 0;
                        const displayYear = by > 100 ? by : (by < 30 ? 2000 + by : 1900 + by);
                        const currentYear = new Date().getFullYear();
                        const age = displayYear ? currentYear - displayYear : 0;
                        return (
                            <>
                                <span className="player-profile-stat__value">{displayYear || "-"}</span>
                                <span className="player-profile-stat__label">
                                    {age > 0 ? `Age ${age}` : "Year"}
                                </span>
                            </>
                        );
                    })()}
                </div>
                <div className="player-profile-stat">
                    <span className="player-profile-stat__value">{profile.level || "-"}</span>
                    <span className="player-profile-stat__label">Level</span>
                </div>
                <div className="player-profile-stat">
                    <span className="player-profile-stat__value">
                        {(() => {
                            const sizeMap: Record<string, string> = {
                                "85": "XS", "90": "S", "95": "M", "100": "L", 
                                "105": "XL", "110": "2XL", "115": "3XL"
                            };
                            return sizeMap[profile.tshirtSize || ""] || profile.tshirtSize || "-";
                        })()}
                    </span>
                    <span className="player-profile-stat__label">T-Shirt</span>
                </div>
                {showEntry && (
                    <div className="player-profile-stat">
                        <span className="player-profile-stat__value">{profile.participationCount || 0}</span>
                        <span className="player-profile-stat__label">Entry</span>
                    </div>
                )}
            </div>

            {statusLabel && (
                <div style={{ padding: '4px 20px 12px 108px', textAlign: 'left' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: statusLabel.includes("대기") ? "#FF9500" : (theme === 'light' ? "#000" : "#fff") }}>
                        {statusLabel}
                    </span>
                </div>
            )}
        </section>
    );
}
