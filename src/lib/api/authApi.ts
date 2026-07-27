/**
 * Remote Authentication API Interface
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
 * [Vercel Serverless] Fetches User Profile through our own API Proxy to avoid CORS.
 */
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
 * [Hybrid Fallback Engine] Fetches User Profile using SDK, Direct API, CORS proxies, and local API.
 */
export async function fetchNaverProfile(accessToken: string): Promise<any> {
    authLogger.log('AUTH_NAVER_PROXY_PROFILE_START', { accessToken: '***' });
    
    const targetUrl = `https://openapi.naver.com/v1/nid/me?access_token=${encodeURIComponent(accessToken)}`;

    // Method 0: Naver Official JS SDK (2s max timeout)
    try {
        const sdkData = await getNaverProfileFromSDK();
        if (sdkData?.response) {
            authLogger.log('AUTH_NAVER_PROFILE_SDK_SUCCESS', { data: sdkData });
            return sdkData;
        }
    } catch (e) {
        console.warn('Naver SDK profile extraction skipped/timeout, trying OpenAPI/proxies...', e);
    }

    // Method 1: Allorigins JSONP/Proxy (Query param access_token)
    try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const data = await res.json();
            if (data?.contents) {
                const parsed = typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                if (parsed?.response) {
                    authLogger.log('AUTH_NAVER_PROFILE_ALLORIGINS_SUCCESS', { data: parsed });
                    return parsed;
                }
            }
        }
    } catch (e) {
        console.warn('Allorigins proxy failed...', e);
    }

    // Method 2: Corsproxy.io (Query param access_token)
    try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const parsed = await res.json();
            if (parsed?.response) {
                authLogger.log('AUTH_NAVER_PROFILE_CORSPROXY_SUCCESS', { data: parsed });
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Corsproxy failed...', e);
    }

    // Method 3: Codetabs Proxy
    try {
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const parsed = await res.json();
            if (parsed?.response) {
                authLogger.log('AUTH_NAVER_PROFILE_CODETABS_SUCCESS', { data: parsed });
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Codetabs failed...', e);
    }

    throw new Error('프로필 조회를 완료하지 못했습니다.');
}
