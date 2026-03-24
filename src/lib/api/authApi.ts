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
    // 인자를 2개로 맞춰줌 (로그이름, 객체) - 트레이싱 가시성 확보
    authLogger.log('AUTH_NAVER_PROXY_PROFILE_START', { accessToken: '***' });
    
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'ERR_PROXY_PROFILE_FAILED');
        }

        // 성공 로그로 변경하고 데이터를 전달하여 디버깅 용이성 확보
        authLogger.log('AUTH_NAVER_PROFILE_PROXY_SUCCESS', { data });
        
        return data.profile;
    } catch (err: any) {
        authLogger.log('AUTH_NAVER_PROFILE_PROXY_ERROR', { error: err.message });
        throw err;
    }
}
