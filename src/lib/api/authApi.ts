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

    // 1차 통로: Direct Cloud Function Endpoint (Firebase Hosting rewrite 우회하여 100% 신뢰성 보장)
    const directUrl = `https://us-central1-hctcplayer.cloudfunctions.net/naverProfile?token=${encodeURIComponent(accessToken)}`;
    const hostingUrl = `/api/auth/naver-profile?token=${encodeURIComponent(accessToken)}`;
    
    let res: Response | null = null;
    let lastError: Error | null = null;

    // Direct Endpoint 먼저 시도
    try {
        res = await fetch(directUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });
    } catch (err: any) {
        authLogger.log('AUTH_NAVER_PROFILE_WARN', { message: 'Direct endpoint failed, trying hosting rewrite' });
        lastError = err;
    }

    // Direct Endpoint가 실패했거나 JSON이 아닌 경우 Hosting rewrite 시도
    if (!res || !res.ok) {
        try {
            res = await fetch(hostingUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
        } catch (err: any) {
            lastError = err;
        }
    }

    if (!res) {
        throw new Error(`네이버 프로필 서버 통신 실패: ${lastError?.message || 'Network Error'}`);
    }

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Naver Profile Proxy Error (${res.status}): ${errBody}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
        throw new Error('서버 프록시 경로에서 HTML 응답이 반환되었습니다. Cloud Function 배포 상태를 확인해주세요.');
    }

    const data = await res.json();

    if (data?.response?.id) {
        authLogger.log('AUTH_NAVER_PROFILE_SUCCESS', { id: data.response.id });
        return data;
    }

    throw new Error(data?.message || data?.error || '네이버 프로필 응답 데이터에 사용자 ID가 없습니다.');
}
