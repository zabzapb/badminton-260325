"use client";
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Icon } from "@/components/ui/Icon";
import "./AppHeader.css";

interface AppHeaderProps {
    showMenu?: boolean;
    logoHref?: string;
}

export function AppHeader({ showMenu = true, logoHref = "/dashboard" }: AppHeaderProps) {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMaster, setIsMaster] = useState(false);
    const [isManager, setIsManager] = useState(false);

    React.useEffect(() => {
        const stored = localStorage.getItem("hctc_user_profile");
        if (stored) {
            const parsed = JSON.parse(stored);
            setIsMaster(!!parsed.isMaster);
            setIsManager(!!parsed.isManager);
        }
    }, [isMenuOpen]); // Refresh when menu opens to be sure

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const navigateTo = (path: string) => {
        setIsMenuOpen(false);
        const currentPath = window.location.pathname.replace(/\/$/, "");
        const targetPath = path.replace(/\/$/, "");

        if (targetPath === "/admin/players") {
            window.dispatchEvent(new CustomEvent("reset-player-view"));
        } else if (targetPath === "/register/tournament") {
            window.dispatchEvent(new CustomEvent("reset-tournament-view"));
        }

        if (currentPath !== targetPath) {
            navigate(path);
        }
    };

    return (
        <>
            <div className="app-header-placeholder" />
            <header className="app-header">
                <Link 
                    to={logoHref} 
                    className="app-header__logo" 
                    onClick={() => {
                        setIsMenuOpen(false);
                        window.dispatchEvent(new CustomEvent("reset-dashboard"));
                    }}
                >
                    <img
                        src="/logo-hkdk.png"
                        alt="한콕두콕"
                        className="app-header__logo-img"
                    />
                </Link>
                <div className="app-header__actions">
                    {showMenu && (
                        <button className="btn-more" onClick={toggleMenu} aria-label="메뉴">
                            <Icon name={isMenuOpen ? "close" : "menu"} size={22} />
                        </button>
                    )}
                </div>
            </header>

            {/* Dropdown Menu Overlay */}
            {showMenu && (
                <div className={`app-header-menu ${isMenuOpen ? 'is-open' : ''}`}>
                    <div className="app-header-menu__content">
                        <div className="app-header-menu__item" onClick={() => navigateTo("/register")}>
                            <Icon name="edit" size={20} />
                            <span>프로필 관리</span>
                        </div>
                        <div className="app-header-menu__item" onClick={() => navigateTo("/admin/players")}>
                            <Icon name="people" size={20} />
                            <span>한콕두콕 플레이어</span>
                        </div>
                        {(isMaster || isManager) && (
                            <>
                                <div className="app-header-menu__item" onClick={() => navigateTo("/register/tournament")}>
                                    <Icon name="trophy" size={20} />
                                    <span>대회 등록 및 관리</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
