import React from 'react';
import { generateNaverAuthUrl } from '@/services/auth/naverProvider';
import './NaverLoginButton.css';

interface NaverLoginButtonProps {
    variant?: '48' | '54';
    className?: string;
    onLoginStart?: () => void;
    onError?: (err: Error) => void;
}

/**
 * Naver Login Button Component
 * Standardized Design (Naver Green #03C75A) and OAuth 2.0 Integration.
 */
export const NaverLoginButton: React.FC<NaverLoginButtonProps> = ({ 
    variant = '54', 
    className = '',
    onLoginStart,
    onError
}) => {
    
    const handleLogin = (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            if (onLoginStart) onLoginStart();
            
            // Generate OAuth URL and redirect
            const url = generateNaverAuthUrl();
            window.location.href = url;
        } catch (err) {
            console.error('Naver login initiation failed:', err);
            if (onError) onError(err as Error);
        }
    };

    return (
        <button 
            type="button"
            className={`naver-login-btn naver-login-btn--v${variant} ${className}`}
            onClick={handleLogin}
            aria-label="네이버 로그인"
        >
            <div className="naver-login-btn__logo">
                <img 
                    src="/naver-logo-circle.png.png" 
                    alt="Naver Logo" 
                    width="20" 
                    height="20" 
                />
            </div>
            <span className="naver-login-btn__text">네이버 로그인</span>
        </button>
    );
};
