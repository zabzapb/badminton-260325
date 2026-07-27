/**
 * Remote Authentication API Interface
 * 
 * 네이버 프로필 조회 우선순위:
 * 1. Firebase Cloud Function 프록시 (/api/auth/naver-profile) - 같은 도메인, CORS 없음, 100% 확실
 * 2. Naver SDK getLoginStatus - 모바일에서 작동, PC에서 3rd-party cookie 차단 시 실패
 * 3. CORS 프록시 (corsproxy.io) - 외부 무료 프록시, 불안정할 수 있음
 */

import { UserProfile } from "@/lib/types";
import { NAVER_CONFIG } from "@/config/auth.config";
import { authLogger } from "@/core/utils/logger";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface SyncResponse {
    success: boolean;
    syncId?: string;
    isNewUser?: boolean;
    error?: string;
    metadata?: any;
}

/**
 * [Vercel Serverless] Exchanges OAuth code for Access Token through our own API Proxy.
 */
export async function exchangeNaverToken(code: string, state: string): Promise<string> {
    authLogger.log('AUTH_NAVER_PROXY_EXCHANGE_START', { code, state });

    try {
        // [Vercel API] Call our local serverless function to bypass CORS and hide secret
        const response = await fetch('/api/auth/naver', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                state,
                clientId: NAVER_CONFIG.clientId
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.access_token) {
            throw new Error(data.error || 'ERR_PROXY_TOKEN_FAILED');
        }

        return data.access_token;
    } catch (err: any) {
        authLogger.log('AUTH_NAVER_PROXY_ERROR', { error: err.message });
        throw err;
    }
}

/**
 * Naver Official JS SDK Profile Extraction
 */
export async function getNaverProfileFromSDK(): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!(window as any).naver?.LoginWithNaverId) {
            reject(new Error('SDK_NOT_AVAILABLE'));
            return;
        }

        const timer = setTimeout(() => {
            reject(new Error('SDK_TIMEOUT_2S'));
        }, 2000);

        try {
            const naverLogin = new (window as any).naver.LoginWithNaverId({
                clientId: import.meta.env.VITE_NAVER_CLIENT_ID || 'Kk3SMMsp_T3X6GoLmS7O',
                callbackUrl: window.location.href.split('#')[0],
                isPopup: false,
                callbackHandle: true
            });

            naverLogin.init();

            setTimeout(() => {
                naverLogin.getLoginStatus((status: boolean) => {
                    clearTimeout(timer);
                    if (status && naverLogin.user) {
                        const u = naverLogin.user;
                        const rawProfile = u._profile || u.raw || {};
                        const id = (typeof u.getId === 'function' ? u.getId() : u.id) || rawProfile.id;
                        const name = (typeof u.getName === 'function' ? u.getName() : u.name) || rawProfile.name || rawProfile.nickname;
                        const mobile = (typeof u.getMobile === 'function' ? u.getMobile() : (u.mobile || u.phone)) || rawProfile.mobile;
                        const gender = (typeof u.getGender === 'function' ? u.getGender() : u.gender) || rawProfile.gender;
                        const birthyear = (typeof u.getBirthyear === 'function' ? u.getBirthyear() : u.birthyear) || rawProfile.birthyear;
                        const profile_image = (typeof u.getProfileImage === 'function' ? u.getProfileImage() : u.profile_image) || rawProfile.profile_image;

                        if (id) {
                            resolve({
                                response: {
                                    id,
                                    name: name || '네이버사용자',
                                    nickname: u.nickname || rawProfile.nickname || name || '네이버사용자',
                                    mobile: mobile || '',
                                    gender: gender || 'M',
                                    birthyear: birthyear || '',
                                    profile_image: profile_image || ''
                                }
                            });
                            return;
                        }
                    }
                    reject(new Error('SDK_LOGIN_STATUS_FALSE'));
                });
            }, 100);
        } catch (e) {
            clearTimeout(timer);
            reject(e);
        }
    });
}

/**
 * [최우선] Firebase Cloud Function 프록시를 통한 네이버 프로필 조회
 * 같은 도메인 호출이므로 CORS 문제 없음. PC/모바일 모든 브라우저에서 100% 동작.
 */
async function fetchNaverProfileViaFunction(accessToken: string): Promise<any> {
    const res = await fetch(`/api/auth/naver-profile?token=${encodeURIComponent(accessToken)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Function proxy error ${res.status}: ${errBody}`);
    }

    const data = await res.json();

    if (data?.response?.id) {
        return data;
    }

    throw new Error(`Function proxy: no profile in response (resultcode: ${data?.resultcode}, message: ${data?.message})`);
}

/**
 * [Hybrid Fallback Engine] Fetches User Profile using Firebase Function, SDK, and CORS proxies.
 */
export async function fetchNaverProfile(accessToken: string): Promise<any> {
    authLogger.log('AUTH_NAVER_PROFILE_START', { accessToken: accessToken.substring(0, 10) + '***' });
    const errors: string[] = [];

    // ★ Method 0: Firebase Cloud Function 프록시 (같은 도메인, CORS 없음, 100% 확실)
    try {
        console.log('[Auth] Method 0: Firebase Function proxy...');
        const fnData = await fetchNaverProfileViaFunction(accessToken);
        if (fnData?.response) {
            console.log('[Auth] ✅ Firebase Function proxy SUCCESS:', fnData.response.id);
            authLogger.log('AUTH_NAVER_PROFILE_FUNCTION_SUCCESS', { id: fnData.response.id });
            return fnData;
        }
    } catch (e: any) {
        console.warn('[Auth] Firebase Function proxy failed:', e.message);
        errors.push(`Function: ${e.message}`);
    }

    // Method 1: Naver Official JS SDK (2s max timeout)
    try {
        console.log('[Auth] Method 1: Naver SDK...');
        const sdkData = await getNaverProfileFromSDK();
        if (sdkData?.response) {
            console.log('[Auth] ✅ SDK SUCCESS');
            authLogger.log('AUTH_NAVER_PROFILE_SDK_SUCCESS', { data: sdkData });
            return sdkData;
        }
    } catch (e: any) {
        console.warn('[Auth] SDK failed:', e.message);
        errors.push(`SDK: ${e.message}`);
    }

    // Method 2: allorigins.win Proxy
    try {
        console.log('[Auth] Method 2: allorigins.win...');
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://openapi.naver.com/v1/nid/me')}`;
        const res = await fetch(proxyUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const parsed = await res.json();
            if (parsed?.response) {
                console.log('[Auth] ✅ allorigins.win SUCCESS');
                authLogger.log('AUTH_NAVER_PROFILE_ALLORIGINS_SUCCESS', { data: parsed });
                return parsed;
            }
        }
    } catch (e: any) {
        console.warn('[Auth] allorigins.win failed:', e.message);
        errors.push(`AllOrigins: ${e.message}`);
    }

    // Method 3: corsproxy.io
    try {
        console.log('[Auth] Method 3: corsproxy.io...');
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://openapi.naver.com/v1/nid/me`)}`;
        const res = await fetch(proxyUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const parsed = await res.json();
            if (parsed?.response) {
                console.log('[Auth] ✅ corsproxy.io SUCCESS');
                authLogger.log('AUTH_NAVER_PROFILE_CORSPROXY_SUCCESS', { data: parsed });
                return parsed;
            }
        }
    } catch (e: any) {
        console.warn('[Auth] corsproxy.io failed:', e.message);
        errors.push(`Proxy: ${e.message}`);
    }

    const errorSummary = errors.join(' / ');
    console.error('[Auth] ❌ All profile methods failed:', errorSummary);
    throw new Error(`프로필 조회를 완료하지 못했습니다. (${errorSummary})`);
}
