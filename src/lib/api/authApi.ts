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

    const res = await fetch(`/api/auth/naver-profile?token=${encodeURIComponent(accessToken)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Naver Profile Proxy Error (${res.status}): ${errBody}`);
    }

    const data = await res.json();

    if (data?.response?.id) {
        authLogger.log('AUTH_NAVER_PROFILE_SUCCESS', { id: data.response.id });
        return data;
    }

    throw new Error(data?.message || '네이버 프로필 응답 데이터에 사용자 ID가 없습니다.');
}
