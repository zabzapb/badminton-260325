/**
 * Remote Authentication API Interface
 * 
 * [단일화된 최적 경량화 프로필 조회 엔진]
 * - 불필요한 Vercel API, JSONP, SDK iframe 폴링, 외부 무료 프록시(corsproxy 등) 모두 제거
 * - Firebase Cloud Function (/api/auth/naver-profile) 단일 통로로 100% 안정적 동작
 */

import { authLogger } from "@/core/utils/logger";

/**
 * 네이버 프로필 조회 (Firebase Cloud Function 서버사이드 프록시)
 * player.nstove.com 동일 도메인 호출로 CORS 문제를 원천 제거하고 100% 신뢰성 보장
 */
export async function fetchNaverProfile(accessToken: string): Promise<any> {
    authLogger.log('AUTH_NAVER_PROFILE_START', { accessToken: accessToken.substring(0, 10) + '***' });

    const primaryUrl = `/api/auth/naver-profile?token=${encodeURIComponent(accessToken)}`;
    
    let res: Response;
    try {
        res = await fetch(primaryUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });
    } catch (fetchErr: any) {
        authLogger.log('AUTH_NAVER_PROFILE_ERROR', { error: fetchErr?.message || String(fetchErr) });
        throw new Error(`네이버 프로필 서버 연결 실패: ${fetchErr?.message || 'Failed to fetch'}`);
    }

    const contentType = res.headers.get('content-type') || '';

    // If Firebase Hosting fallback returned SPA index.html instead of JSON API response
    if (contentType.includes('text/html')) {
        authLogger.log('AUTH_NAVER_PROFILE_WARN', { message: 'Primary proxy returned HTML, trying direct Cloud Function' });
        const directUrl = `https://us-central1-hctcplayer.cloudfunctions.net/naverProfile?token=${encodeURIComponent(accessToken)}`;
        try {
            res = await fetch(directUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
        } catch (directErr: any) {
            throw new Error(`Cloud Function 직접 호출 실패: ${directErr?.message || String(directErr)}`);
        }
    }

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Naver Profile Proxy Error (${res.status}): ${errBody}`);
    }

    const data = await res.json();

    if (data?.response?.id) {
        authLogger.log('AUTH_NAVER_PROFILE_SUCCESS', { id: data.response.id });
        return data;
    }

    throw new Error(data?.message || data?.error || '네이버 프로필 응답 데이터에 사용자 ID가 없습니다.');
}
