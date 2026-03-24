/**
 * Naver Login Callback Page
 * Receives the auth code, verifies CSRF state, and finalizes the login process.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyOauthState } from '@/services/auth/naverProvider';
import { normalizeNaverUser } from '@/services/auth/naverTransformer';
import { finalizeLogin } from '@/services/auth/authService';
import { exchangeNaverToken, fetchNaverProfile } from '@/lib/api/authApi';
import { UserProfile } from '@/lib/types';
import './callback.css';

export default function NaverAuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const hasProcessed = useRef(false);

    useEffect(() => {
        // [Safety Net] Max 5 seconds for the whole process
        const safetyTimeout = setTimeout(() => {
            if (status === 'loading') {
                console.error('Authentication process timed out (5s)');
                setStatus('error');
            }
        }, 5000);

        const processAuth = async () => {
            // [Resilience] Prevent double execution in React 18 Strict Mode
            if (hasProcessed.current) return;
            hasProcessed.current = true;

            const code = searchParams.get('code');
            const state = searchParams.get('state') || '';
            const error = searchParams.get('error');

            if (error || !code) {
                console.error('Naver login failed:', error);
                setStatus('error');
                clearTimeout(safetyTimeout);
                return;
            }

            try {
                // 1. [Security] Verify CSRF state
                if (!verifyOauthState(state)) {
                    console.warn('Security Alert: Invalid CSRF state.');
                    setStatus('error');
                    clearTimeout(safetyTimeout);
                    return;
                }

                // 2. Real: Exchange token and fetch profile
                const accessToken = await exchangeNaverToken(code, state);
                const naverProfileData = await fetchNaverProfile(accessToken);

                // 3. Normalize and Sync
                const normalized = normalizeNaverUser(naverProfileData);
                const { success, isNewUser } = await finalizeLogin(normalized as UserProfile);

                if (success) {
                    clearTimeout(safetyTimeout);
                    if (isNewUser) {
                        // [Forced Progress] Redirect to Profile Management for first-time or incomplete setups
                        navigate('/register', { replace: true });
                    } else {
                        navigate('/dashboard', { replace: true });
                    }
                } else {
                    setStatus('error');
                    clearTimeout(safetyTimeout);
                }
            } catch (err) {
                console.error('Naver Authentication Finalize failed:', err);
                setStatus('error');
                clearTimeout(safetyTimeout);
            }
        };

        processAuth();
        return () => clearTimeout(safetyTimeout);
    }, [searchParams, navigate]);

    return (
        <div className="callback-page">
            <div className="callback-container">
                {status === 'loading' ? (
                    <>
                        <div className="loading-spinner-large" />
                        <h2 className="callback-status">네이버 인증 처리 중</h2>
                        <p className="callback-hint">잠시만 기다려 주세요. 안전하게 로그인 중입니다.</p>
                    </>
                ) : (
                    <>
                        <div className="error-icon">⚠️</div>
                        <h2 className="callback-status">로그인 실패</h2>
                        <p className="callback-hint">네이버 인증 서버와 통신 중 오류가 발생했습니다.</p>
                        <p className="callback-hint-minor">
                            브라우저의 CORS 정책 또는 네트워크 상태를 확인해 주세요. 
                            (로컬 개발 시에는 Vite Proxy 설정을, 배포 시에는 API 환경 설정을 확인해야 합니다.)
                        </p>
                        <button className="btn-retry" onClick={() => navigate('/')}>다시 시도하기</button>
                    </>
                )}
            </div>
        </div>
    );
}
