/**
 * Naver Data Transformer
 * Normalizes Naver API responses into system Player (UserProfile) objects.
 */

import { UserProfile } from "@/lib/types";

export interface NaverResponseData {
  resultcode: string;
  response: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    gender?: string;
    age?: string;
    birthday?: string;
    birthyear?: string;
    mobile?: string;
    profile_image?: string;
  };
}

/**
 * Normalizes a raw Naver profile into a Player (UserProfile) object.
 */
export function normalizeNaverUser(naverData: any): Partial<UserProfile> {
  const profile = naverData?.response || naverData;
  
  // [Strict Validation] Ensure atomic level identity data is present
  if (!profile || !profile.id) {
    throw new Error(`ERR_AUTH_NAVER_INCOMPLETE_PROFILE: ${JSON.stringify(naverData || {})}`);
  }

  // Fallback for name & phone to prevent auth hard-block
  const realName = profile.name || profile.nickname || '네이버사용자';
  const normalizedPhone = (profile.mobile || profile.phone || '').replace(/[^0-9]/g, '');

  return {
    id: profile.id,
    realName: realName,
    nickname: profile.nickname || realName,
    gender: (profile.gender?.toUpperCase() === 'F' || profile.gender?.toUpperCase() === 'W') ? 'F' : 'M',
    phone: normalizedPhone,
    birthYear: profile.birthyear ? parseInt(profile.birthyear, 10) : undefined,
    birthDate: (profile.birthyear && profile.birthday) ? `${profile.birthyear}-${profile.birthday}` : undefined,
    avatarUrl: profile.profile_image,
    isVerified: true,
  };
}
