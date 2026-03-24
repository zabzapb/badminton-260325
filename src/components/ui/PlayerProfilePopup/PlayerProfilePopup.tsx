/**
 * Component: PlayerProfilePopup
 * 선수 프로필을 팝업 레이어로 보여주는 재사용 가능한 컴포넌트
 */
import React from "react";
import { PlayerProfileCard, PlayerProfile } from "@/components/ui/PlayerProfileCard";
import { Icon } from "@/components/ui/Icon";
import "./PlayerProfilePopup.css";

interface PlayerProfilePopupProps {
    profile: PlayerProfile | null;
    onClose: () => void;
}

export function PlayerProfilePopup({ profile, onClose }: PlayerProfilePopupProps) {
    if (!profile) return null;

    return (
        <div className="player-profile-popup-overlay" onClick={onClose}>
            <div className="player-profile-popup-content" onClick={e => e.stopPropagation()}>
                <button className="popup-close-btn" onClick={onClose} aria-label="닫기">
                    <Icon name="close" size={20} />
                </button>
                <PlayerProfileCard profile={profile} />
            </div>
        </div>
    );
}
