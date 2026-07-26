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
export async function fetchNaverProfile(accessToken: string): Promise<any> {
    authLogger.log('AUTH_NAVER_PROXY_PROFILE_START', { accessToken: '***' });
    
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
