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
export function normalizeNaverUser(naverData: NaverResponseData): Partial<UserProfile> {
  const { response: profile } = naverData;
  
  // [Strict Validation] Ensure atomic level identity data is present
  if (!profile || !profile.id) {
    throw new Error('ERR_AUTH_NAVER_INCOMPLETE_PROFILE');
  }

  // Mandatory fields for HCTC Player identity
  if (!profile.name && !profile.nickname) {
    throw new Error('ERR_AUTH_NAVER_MISSING_NAME');
  }
  
  if (!profile.mobile) {
    throw new Error('ERR_AUTH_NAVER_MISSING_PHONE');
  }

  // Phone normalization: Removes hyphens, ensures numeric consistency.
  const normalizedPhone = (profile.mobile || '').replace(/[^0-9]/g, '');

  return {
    id: profile.id,
    realName: profile.name || profile.nickname || 'Unknown',
    nickname: profile.nickname,
    gender: profile.gender === 'W' ? 'F' : 'M',
    phone: normalizedPhone,
    birthYear: profile.birthyear ? parseInt(profile.birthyear, 10) : undefined,
    birthDate: (profile.birthyear && profile.birthday) ? `${profile.birthyear}-${profile.birthday}` : undefined,
    avatarUrl: profile.profile_image,
    isVerified: true,
  };
}
