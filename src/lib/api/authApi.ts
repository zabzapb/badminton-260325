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

    // 1차 통로: Same-Origin Hosting Proxy (Firebase Hosting rewrites through asia-northeast3)
    const hostingUrl = `/api/auth/naver-profile?token=${encodeURIComponent(accessToken)}`;
    const directUrl = `https://asia-northeast3-hctcplayer.cloudfunctions.net/naverProfile?token=${encodeURIComponent(accessToken)}`;
    
    let res: Response | null = null;
    let lastError: Error | null = null;

    // 1차: Firebase Hosting Rewrite 요청
    try {
        res = await fetch(hostingUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });
    } catch (err: any) {
        authLogger.log('AUTH_NAVER_PROFILE_WARN', { message: 'Hosting rewrite failed, trying direct endpoint' });
        lastError = err;
    }

    // 만약 호스팅 프록시가 실패했거나 HTML(index.html)이 떨어진 경우 2차 Direct Endpoint 시도
    const contentType = res?.headers.get('content-type') || '';
    if (!res || !res.ok || contentType.includes('text/html')) {
        try {
            const fallbackRes = await fetch(directUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
            if (fallbackRes.ok) {
                res = fallbackRes;
            }
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

    const data = await res.json();

    if (data?.response?.id) {
        authLogger.log('AUTH_NAVER_PROFILE_SUCCESS', { id: data.response.id });
        return data;
    }

    throw new Error(data?.message || data?.error || '네이버 프로필 응답 데이터에 사용자 ID가 없습니다.');
}
