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
        // [Safety Net] Max 10 seconds for the whole process
        const safetyTimeout = setTimeout(() => {
            if (status === 'loading') {
                console.error('Authentication process timed out (10s)');
                setStatus('error');
            }
        }, 10000);

        const processAuth = async () => {
            if (hasProcessed.current) return;
            hasProcessed.current = true;

            const code = searchParams.get('code');
            const state = searchParams.get('state') || '';
            const error = searchParams.get('error');

            if (error || !code) {
                setStatus('error');
                clearTimeout(safetyTimeout);
                return;
            }

            try {
                // 1. Verify CSRF
                // 1. Verify CSRF
                if (!verifyOauthState(state)) {
                    setStatus('error');
                    clearTimeout(safetyTimeout);
                    return;
                }

                // 2. Exchange token
                // 2. Exchange token
                const accessToken = await exchangeNaverToken(code, state);
                const naverProfileData = await fetchNaverProfile(accessToken);

                // 3. Sync
                // 3. Sync
                const normalized = normalizeNaverUser(naverProfileData);
                const { success, isNewUser } = await finalizeLogin(normalized as UserProfile);

                if (success) {
                    clearTimeout(safetyTimeout);
                    
                    // Proceed immediately for maximum speed as requested
                    if (isNewUser) {
                        navigate('/register', { replace: true });
                    } else {
                        navigate('/dashboard', { replace: true });
                    }
                } else {
                    setStatus('error');
                }
            } catch (err) {
                console.error('Login error:', err);
                setStatus('error');
            }
        };

        processAuth();
        return () => clearTimeout(safetyTimeout);
    }, [searchParams, navigate]);

    return (
        <div className="callback-page">
            {status === 'loading' && (
                <div className="callback-loading-ui-fullscreen">
                    <img src="/loading_03.gif" alt="인증 처리 중" className="loading-bg-img" />
                    <div className="loading-text-overlay-centered">
                        네이버 인증과 한콕두콕 인증을 처리 중입니다.
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="callback-container error-state">
                    <div className="error-icon">⚠️</div>
                    <h2 className="callback-status">로그인 실패</h2>
                    <p className="callback-hint">네이버 인증 서버와 통신 중 오류가 발생했습니다.</p>
                    <p className="callback-hint-minor">
                        잠시 후 다시 시도하시거나 관리자에게 문의바랍니다.
                    </p>
                    <button className="btn-retry" onClick={() => navigate('/')}>다시 시도하기</button>
                </div>
            )}
        </div>
    );
}
