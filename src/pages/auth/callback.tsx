/**
 * Naver Login Callback Page
 * 
 * 인증 전략 (우선순위):
 * 1. Naver SDK 직접 초기화 - 콜백 URL 해시의 access_token을 SDK가 자동 인식
 *    (CORS 없음, 프록시 없음, 100% 네이티브)
 * 2. Fallback: access_token 추출 후 fetchNaverProfile (JSONP/프록시 체인)
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeNaverUser } from '@/services/auth/naverTransformer';
import { finalizeLogin } from '@/services/auth/authService';
import { UserProfile } from '@/lib/types';
import './callback.css';

/** Naver SDK로 프로필 추출 (콜백 페이지 전용) */
function getProfileFromNaverSDK(): Promise<any> {
    return new Promise((resolve, reject) => {
        const naver = (window as any).naver;
        if (!naver?.LoginWithNaverId) {
            reject(new Error('NAVER_SDK_NOT_LOADED'));
            return;
        }

        const timeout = setTimeout(() => {
            reject(new Error('SDK_INIT_TIMEOUT_8S'));
        }, 8000);

        try {
            const naverLogin = new naver.LoginWithNaverId({
                clientId: import.meta.env.VITE_NAVER_CLIENT_ID || 'Kk3SMMsp_T3X6GoLmS7O',
                callbackUrl: window.location.href.split('#')[0].split('?')[0],
                isPopup: false,
                callbackHandle: true,
            });

            naverLogin.init();

            // SDK init 후 약간의 딜레이를 두고 getLoginStatus 호출
            // 딜레이를 점진적으로 늘리며 재시도
            const tryGetStatus = (attempt: number) => {
                const delay = attempt === 0 ? 300 : attempt === 1 ? 800 : 2000;

                setTimeout(() => {
                    naverLogin.getLoginStatus((status: boolean) => {
                        if (status && naverLogin.user) {
                            clearTimeout(timeout);
                            const u = naverLogin.user;

                            // 프로필 데이터 추출 (다양한 SDK 버전 호환)
                            const id = u.id || u.getId?.() || u._profile?.id;
                            const name = u.name || u.getName?.() || u.nickname || u._profile?.name || u._profile?.nickname;
                            const mobile = u.mobile || u.getMobile?.() || u._profile?.mobile;
                            const gender = u.gender || u.getGender?.() || u._profile?.gender;
                            const birthyear = u.birthyear || u.getBirthyear?.() || u._profile?.birthyear;
                            const birthday = u.birthday || u.getBirthday?.() || u._profile?.birthday;
                            const profile_image = u.profile_image || u.getProfileImage?.() || u._profile?.profile_image;
                            const nickname = u.nickname || u.getNickName?.() || u._profile?.nickname;

                            if (id) {
                                console.log('[NaverSDK] Profile extracted successfully:', { id, name });
                                resolve({
                                    response: {
                                        id,
                                        name: name || '네이버사용자',
                                        nickname: nickname || name || '네이버사용자',
                                        mobile: mobile || '',
                                        gender: gender || 'M',
                                        birthyear: birthyear || '',
                                        birthday: birthday || '',
                                        profile_image: profile_image || '',
                                    }
                                });
                                return;
                            }
                        }

                        // 재시도
                        if (attempt < 2) {
                            console.warn(`[NaverSDK] Attempt ${attempt + 1} failed, retrying...`);
                            tryGetStatus(attempt + 1);
                        } else {
                            clearTimeout(timeout);
                            reject(new Error('SDK_NO_PROFILE_AFTER_RETRIES'));
                        }
                    });
                }, delay);
            };

            tryGetStatus(0);

        } catch (e) {
            clearTimeout(timeout);
            reject(e);
        }
    });
}

/** URL에서 access_token 파싱 */
function parseAccessTokenFromUrl(): { accessToken: string | null; error: string | null } {
    const href = window.location.href;
    let accessToken: string | null = null;
    let error: string | null = null;

    if (href.includes('access_token=')) {
        const match = href.match(/access_token=([^&#]+)/);
        if (match) accessToken = decodeURIComponent(match[1]);
    }
    if (href.includes('error=')) {
        const match = href.match(/error=([^&#]+)/);
        if (match) error = decodeURIComponent(match[1]);
    }

    return { accessToken, error };
}

export default function NaverAuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorDetail, setErrorDetail] = useState<string>('');
    const hasProcessed = useRef(false);

    useEffect(() => {
        // [Safety Net] Max 15 seconds for the whole process (SDK 재시도 포함)
        const safetyTimeout = setTimeout(() => {
            if (status === 'loading') {
                console.error('Authentication process timed out (15s)');
                setErrorDetail('인증 처리 시간이 초과되었습니다. (15초 타임아웃)');
                setStatus('error');
            }
        }, 15000);

        const processAuth = async () => {
            if (hasProcessed.current) return;
            hasProcessed.current = true;

            try {
                // Step 1: URL에서 access_token 존재 여부 확인
                const { accessToken, error: urlError } = parseAccessTokenFromUrl();

                if (urlError) {
                    throw new Error(`네이버 인증 오류: ${urlError}`);
                }

                if (!accessToken) {
                    throw new Error('URL에서 access_token을 찾을 수 없습니다.');
                }

                console.log('[Auth] access_token parsed, length:', accessToken.length);

                // Step 2: SDK 직접 초기화로 프로필 가져오기 (최우선)
                let naverProfileData: any = null;

                try {
                    console.log('[Auth] Method 1: Naver SDK direct init...');
                    naverProfileData = await getProfileFromNaverSDK();
                    console.log('[Auth] SDK profile success:', naverProfileData?.response?.id);
                } catch (sdkErr: any) {
                    console.warn('[Auth] SDK failed:', sdkErr.message);
                }

                // Step 3: SDK 실패 시 Fallback - fetchNaverProfile (JSONP/프록시 체인)
                if (!naverProfileData?.response) {
                    try {
                        console.log('[Auth] Method 2: fetchNaverProfile fallback...');
                        const { fetchNaverProfile } = await import('@/lib/api/authApi');
                        naverProfileData = await fetchNaverProfile(accessToken);
                        console.log('[Auth] Fallback profile success:', naverProfileData?.response?.id);
                    } catch (fallbackErr: any) {
                        console.error('[Auth] All profile methods failed:', fallbackErr.message);
                        throw new Error(`프로필 조회 실패: SDK(${(naverProfileData as any)?.message || 'timeout'}) / API(${fallbackErr.message})`);
                    }
                }

                if (!naverProfileData?.response?.id) {
                    throw new Error('프로필 데이터에 ID가 없습니다.');
                }

                // Step 4: 프로필 정규화 및 로그인 완료
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
                console.error('[Auth] Login processing error:', err);
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
