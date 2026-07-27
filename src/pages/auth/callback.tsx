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
    const [errorDetail, setErrorDetail] = useState<string>('');
    const hasProcessed = useRef(false);

    useEffect(() => {
        // [Safety Net] Max 10 seconds for the whole process
        const safetyTimeout = setTimeout(() => {
            if (status === 'loading') {
                console.error('Authentication process timed out (10s)');
                setErrorDetail('인증 처리 시간이 초과되었습니다. (10초 타임아웃)');
                setStatus('error');
            }
        }, 10000);

        const processAuth = async () => {
            if (hasProcessed.current) return;
            hasProcessed.current = true;

            try {
                // Parse access_token from full URL href to ensure hash/query compatibility
                const href = window.location.href;
                let accessToken: string | null = null;
                let error: string | null = null;

                if (href.includes('access_token=')) {
                    const match = href.match(/access_token=([^&]+)/);
                    if (match) accessToken = decodeURIComponent(match[1]);
                }
                if (href.includes('error=')) {
                    const match = href.match(/error=([^&]+)/);
                    if (match) error = decodeURIComponent(match[1]);
                }

                if (error || !accessToken) {
                    const msg = `URL 토큰 파싱 실패: ${error || 'access_token 없음'} (href: ${href.substring(0, 80)}...)`;
                    console.error(msg);
                    setErrorDetail(msg);
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
                    setErrorDetail('로그인 정보 저장 중 실패가 발생했습니다.');
                    setStatus('error');
                    clearTimeout(safetyTimeout);
                }
            } catch (err: any) {
                const errMsg = err?.message || String(err);
                console.error('Login processing error:', err);
                setErrorDetail(errMsg);
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
                    {errorDetail && (
                        <p style={{ color: '#FF6B3D', fontSize: '12px', wordBreak: 'break-all', margin: '8px 0', opacity: 0.8 }}>
                            ({errorDetail})
                        </p>
                    )}
                    <p className="callback-hint-minor">
                        잠시 후 다시 시도하시거나 관리자에게 문의바랍니다.
                    </p>
                    <button className="btn-retry" onClick={() => navigate('/')}>다시 시도하기</button>
                </div>
            )}
        </div>
    );
}
