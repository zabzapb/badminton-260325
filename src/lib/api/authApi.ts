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
        try {
            const naverLogin = new (window as any).naver.LoginWithNaverId({
                clientId: import.meta.env.VITE_NAVER_CLIENT_ID || 'Kk3SMMsp_T3X6GoLmS7O',
                callbackUrl: window.location.href.split('#')[0],
                isPopup: false,
                callbackHandle: true
            });
            naverLogin.init();
            naverLogin.getLoginStatus((status: boolean) => {
                if (status && naverLogin.user) {
                    const u = naverLogin.user;
                    const rawProfile = u._profile || {};
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
                                name,
                                nickname: u.nickname || rawProfile.nickname || name,
                                mobile,
                                gender,
                                birthyear,
                                profile_image
                            }
                        });
                        return;
                    }
                }
                reject(new Error('SDK_LOGIN_STATUS_FALSE'));
            });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * [Hybrid Fallback Engine] Fetches User Profile using SDK, Direct API, CORS proxies, and local API.
 */
export async function fetchNaverProfile(accessToken: string): Promise<any> {
    authLogger.log('AUTH_NAVER_PROXY_PROFILE_START', { accessToken: '***' });
    
    // Method 0: Naver Official JS SDK (Bypasses CORS completely via SDK postMessage/iframe)
    try {
        const sdkData = await getNaverProfileFromSDK();
        if (sdkData?.response) {
            authLogger.log('AUTH_NAVER_PROFILE_SDK_SUCCESS', { data: sdkData });
            return sdkData;
        }
    } catch (e) {
        console.warn('Naver SDK profile extraction skipped or failed, trying OpenAPI/proxies...', e);
    }

    // 1. Direct fetch to Naver OpenAPI
    try {
        const directRes = await fetch('https://openapi.naver.com/v1/nid/me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (directRes.ok) {
            const data = await directRes.json();
            if (data?.response) {
                authLogger.log('AUTH_NAVER_PROFILE_DIRECT_SUCCESS', { data });
                return data;
            }
        }
    } catch (e) {
        console.warn('Direct Naver profile fetch failed or CORS blocked, trying CORS proxy...', e);
    }

    // 2. CORS Proxy 1: corsproxy.io
    try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent('https://openapi.naver.com/v1/nid/me')}`;
        const proxyRes = await fetch(proxyUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (proxyRes.ok) {
            const data = await proxyRes.json();
            if (data?.response) {
                authLogger.log('AUTH_NAVER_PROFILE_PROXY_SUCCESS', { data });
                return data;
            }
        }
    } catch (e) {
        console.warn('corsproxy.io failed, trying backup proxy...', e);
    }

    // 3. CORS Proxy 2: allorigins
    try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://openapi.naver.com/v1/nid/me')}`;
        const proxyRes = await fetch(proxyUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (proxyRes.ok) {
            const data = await proxyRes.json();
            if (data?.response) {
                authLogger.log('AUTH_NAVER_PROFILE_ALLORIGINS_SUCCESS', { data });
                return data;
            }
        }
    } catch (e) {
        console.warn('Backup CORS proxy failed, trying local API...', e);
    }

    // 4. Serverless API fallback (if serverless endpoint exists)
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken })
        });
        if (response.ok) {
            const data = await response.json();
            if (data?.success) return data;
        }
    } catch (err: any) {
        authLogger.log('AUTH_NAVER_PROFILE_PROXY_ERROR', { error: err.message });
    }

    throw new Error('ERR_PROXY_PROFILE_FAILED');
}
