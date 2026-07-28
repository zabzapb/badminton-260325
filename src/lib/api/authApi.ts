/**
 * Remote Authentication API Interface
 * Naver Profile Fetching via Server-side Proxy (/api/auth/naver-profile)
 */

import { authLogger } from "@/core/utils/logger";

/**
 * 네이버 프로필 조회 (Firebase Cloud Function 프록시)
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

    throw new Error(data?.message || data?.error || '네이버 프로필 응답 데이터에 사용자 ID가 없습니다.');
}
