/**
 * util: avatar.ts
 * 아바타 이미지 관련 유틸리티
 * - 남성 아바타 (105개): /avatars/avator_m_001.jpg ~ 105.jpg
 * - 여성 아바타 (57개): /avatars/avator_w_001.jpg ~ 057.jpg
 */

const TOTAL_MALE_AVATARS = 105;
const TOTAL_FEMALE_AVATARS = 57;

/**
 * 성별에 따른 랜덤 아바타 경로 반환
 * @param gender "M" | "F"
 * @param usedUrls 이미 배정된 아바타 목록 (중복 방지용)
 */
export function getRandomAvatarByGender(gender: "M" | "F", usedUrls: string[] = []): string {
    const total = gender === "M" ? TOTAL_MALE_AVATARS : TOTAL_FEMALE_AVATARS;
    const prefix = gender === "M" ? "m" : "w";

    // 가능한 모든 후보 생성
    const candidates = Array.from({ length: total }, (_, i) =>
        `/avatars/avator_${prefix}_${String(i + 1).padStart(3, "0")}.jpg`
    );

    // usedUrls에 포함되지 않은 후보들 필터링
    const available = candidates.filter(url => !usedUrls.includes(url));

    // 남은 게 없으면 전체 중 하나 랜덤 (중복 허용 불가피한 경우)
    const source = available.length > 0 ? available : candidates;
    const randomIndex = Math.floor(Math.random() * source.length);

    return source[randomIndex];
}

/** 기존 getAvatarUrl 호환성 유지 (필요시) */
export function getAvatarUrl(playerName: string, gender: "M" | "F" = "M"): string {
    const total = gender === "M" ? TOTAL_MALE_AVATARS : TOTAL_FEMALE_AVATARS;
    const prefix = gender === "M" ? "m" : "w";

    let hash = 0;
    for (let i = 0; i < playerName.length; i++) {
        hash = (hash * 31 + playerName.charCodeAt(i)) >>> 0;
    }
    const index = (hash % total) + 1;
    return `/avatars/avator_${prefix}_${String(index).padStart(3, "0")}.jpg`;
}
