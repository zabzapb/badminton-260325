/**
 * Naver Login Callback Page
 * Extracts access_token directly from URL hash (Implicit Grant)
 * Fetches Naver User Profile via /api/auth/profile and finalizes login.
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNaverProfile } from '@/lib/api/authApi';
import { normalizeNaverUser } from '@/services/auth/naverTransformer';
import { finalizeLogin } from '@/services/auth/authService';
import { UserProfile } from '@/lib/types';
import './callback.css';

export default function NaverAuthCallback() {
    const navigate = useNavigate();
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

            try {
                // Parse access_token from URL hash (#access_token=...)
                const hash = window.location.hash.startsWith('#')
                    ? window.location.hash.substring(1)
                    : window.location.hash;

                const searchParams = new URLSearchParams(hash);
                const accessToken = searchParams.get('access_token');
                const error = searchParams.get('error');

                if (error || !accessToken) {
                    console.error('No access token found in URL hash or OAuth error returned', { error, hash });
                    setStatus('error');
                    clearTimeout(safetyTimeout);
                    return;
                }

                // Fetch user profile via local dev middleware or Vercel serverless
                const naverProfileData = await fetchNaverProfile(accessToken);
                const normalized = normalizeNaverUser(naverProfileData);
                const { success, isNewUser } = await finalizeLogin(normalized as UserProfile);

                if (success) {
                    clearTimeout(safetyTimeout);
                    navigate(isNewUser ? '/register' : '/dashboard', { replace: true });
                } else {
                    console.error('Login finalization failed');
                    setStatus('error');
                    clearTimeout(safetyTimeout);
                }
            } catch (err) {
                console.error('Login processing error:', err);
                setStatus('error');
                clearTimeout(safetyTimeout);
            }
        };

        processAuth();
        return () => clearTimeout(safetyTimeout);
    }, [navigate, status]);

    return (
        <div className="callback-page">
            {status === 'loading' && (
                <div className="callback-loading-ui-fullscreen">
                    <img src="/loading_03.gif" alt="인증 처리 중" className="loading-bg-img" />
                    <div className="loading-text-overlay-centered">
                        한콕두콕 플레이어 등록을 위한 로그인을 진행 중 입니다.
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
