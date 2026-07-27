/**
 * Naver Login Callback Page
 * 
 * [단일 직렬화 파이프라인]
 * 1. URL Hash에서 access_token 파싱
 * 2. Firebase Cloud Function 프록시를 통해 프로필 조회 (fetchNaverProfile)
 * 3. 프로필 정규화 (normalizeNaverUser)
 * 4. 사용자 세션 및 데이터베이스 동기화 (finalizeLogin)
 * 5. 페이지 이동 (/dashboard 또는 /register)
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNaverProfile } from '@/lib/api/authApi';
import { normalizeNaverUser } from '@/services/auth/naverTransformer';
import { finalizeLogin } from '@/services/auth/authService';
import { UserProfile } from '@/lib/types';
import './callback.css';

/** URL에서 access_token 파싱 */
function parseAccessTokenFromUrl(): { accessToken: string | null; error: string | null } {
    const fullUrl = window.location.href;
    const hash = window.location.hash;
    const search = window.location.search;
    const combined = `${fullUrl} ${hash} ${search}`;

    let accessToken: string | null = null;
    let error: string | null = null;

    const tokenMatch = combined.match(/access_token=([^&#]+)/);
    if (tokenMatch) {
        accessToken = decodeURIComponent(tokenMatch[1]);
    }

    const errorMatch = combined.match(/error=([^&#]+)/);
    if (errorMatch) {
        error = decodeURIComponent(errorMatch[1]);
    }

    return { accessToken, error };
}

export default function NaverAuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorDetail, setErrorDetail] = useState<string>('');
    const hasProcessed = useRef(false);

    useEffect(() => {
        // [Safety Net] 최대 10초 타임아웃
        const safetyTimeout = setTimeout(() => {
            if (status === 'loading') {
                setErrorDetail('인증 처리 시간이 초과되었습니다. (10초 타임아웃)');
                setStatus('error');
            }
        }, 10000);

        const processAuth = async () => {
            if (hasProcessed.current) return;
            hasProcessed.current = true;

            try {
                // 1. URL에서 access_token 추출
                const { accessToken, error: urlError } = parseAccessTokenFromUrl();

                if (urlError) {
                    throw new Error(`네이버 인증 오류: ${urlError}`);
                }

                if (!accessToken) {
                    throw new Error('URL에서 access_token을 찾을 수 없습니다.');
                }

                // 2. 단일 Cloud Function 통로로 프로필 조회
                const naverProfileData = await fetchNaverProfile(accessToken);

                if (!naverProfileData?.response?.id) {
                    throw new Error('프로필 데이터에 사용자 ID가 포함되지 않았습니다.');
                }

                // 3. 데이터 정규화 및 로그인 세션 수립
                const normalized = normalizeNaverUser(naverProfileData);
                const { success, isNewUser } = await finalizeLogin(normalized as UserProfile);

                if (success) {
                    clearTimeout(safetyTimeout);
                    navigate(isNewUser ? '/register' : '/dashboard', { replace: true });
                } else {
                    throw new Error('로그인 정보 저장 중 실패가 발생했습니다.');
                }
            } catch (err: any) {
                const errMsg = err?.message || String(err);
                console.error('[Auth] Processing Error:', err);
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
