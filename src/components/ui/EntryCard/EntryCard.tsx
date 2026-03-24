/**
 * Component: EntryCard - Icon 컴포넌트 적용
 */
import { Icon } from "@/components/ui/Icon";
import "./EntryCard.css";

export type VerificationStatus = "verified" | "unverified" | "pending";

export interface EntryCardProps {
    name: string;
    eventType: string;
    level: string;
    ageGroup: number;
    eventDate: string;
    verificationStatus: VerificationStatus;
    avatarUrl?: string;
    initials?: string;
    hasPartner?: boolean;
    onClick?: () => void;
    onCancel?: () => void;
    onAddPartner?: () => void;
}

const statusConfig: Record<VerificationStatus, { label: string; className: string }> = {
    verified: { label: "인증완료", className: "badge badge-verified" },
    unverified: { label: "미인증", className: "badge badge-unverified" },
    pending: { label: "확인중", className: "badge badge-pending" },
};

export function EntryCard({
    name,
    eventType,
    level,
    ageGroup,
    eventDate,
    verificationStatus,
    avatarUrl,
    initials,
    hasPartner = false,
    onClick,
    onCancel,
    onAddPartner,
}: EntryCardProps) {
    const status = statusConfig[verificationStatus];
    const avatarLetter = initials ?? name.charAt(0);

    return (
        <article
            className="entry-card"
            onClick={onClick}
            role="button"
            tabIndex={0}
            aria-label={`${name} 선수 엔트리 카드`}
            onKeyDown={(e) => e.key === "Enter" && onClick?.()}
        >
            {/* Main Row */}
            <div className="entry-card__main">
                {/* Avatar */}
                <div
                    className={`entry-card__avatar ${verificationStatus === "verified" ? "entry-card__avatar--verified" : ""}`}
                    aria-hidden="true"
                >
                    {avatarUrl
                        ? <img src={avatarUrl} alt={`${name} 프로필`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : avatarLetter
                    }
                </div>

                {/* Info */}
                <div className="entry-card__info">
                    <p className="entry-card__name">{name}</p>
                    <div className="entry-card__meta">
                        <span>{eventType}</span>
                        <span className="entry-card__meta-dot" />
                        <span>{ageGroup}대</span>
                        <span className="entry-card__meta-dot" />
                        <span>{level}급</span>
                    </div>
                    <div className="entry-card__schedule">
                        <Icon name="calendar" size={12} color="var(--color-text-disabled)" strokeWidth={1.75} />
                        <span>{eventDate}</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="entry-card__badge-wrap">
                    <span className={status.className}>{status.label}</span>
                </div>
            </div>

            {/* Action Bar */}
            <div className="entry-card__actions" onClick={(e) => e.stopPropagation()}>
                {!hasPartner && onAddPartner && (
                    <button
                        className="entry-card__action-btn entry-card__action-btn--primary"
                        onClick={onAddPartner}
                        aria-label={`${name} 파트너 추가`}
                    >
                        <Icon name="person-add" size={14} color="#000" />
                        파트너 추가
                    </button>
                )}
                {hasPartner && (
                    <button
                        className="entry-card__action-btn entry-card__action-btn--ghost"
                        aria-label={`${name} 파트너 확인`}
                    >
                        <Icon name="people" size={14} />
                        파트너 확인
                    </button>
                )}
                {onCancel && (
                    <button
                        className="entry-card__action-btn"
                        style={{ background: "rgba(255,69,58,0.12)", color: "var(--color-status-error)", flex: "0 0 auto", padding: "8px 12px" }}
                        onClick={onCancel}
                        aria-label={`${name} 참가 취소`}
                    >
                        <Icon name="close" size={14} color="var(--color-status-error)" />
                    </button>
                )}
            </div>
        </article>
    );
}
