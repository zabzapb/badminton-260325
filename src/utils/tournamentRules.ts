import { LEVEL_LIST } from "./tournamentUtils";

export const getCategoryCode = (cat: string) => {
    switch(cat) {
        case "남복": return "MD";
        case "여복": return "WD";
        case "혼복": return "XD";
        case "단식": return "S";
        default: return cat;
    }
};

export const formatHistoryLabel = (category: string, group: string) => {
    const code = getCategoryCode(category);
    const cleanedGroup = group.replace(/대/g, ""); // "30대 A" -> "30 A"
    return `${code} ${cleanedGroup}`;
};

export const extractInfo = (groupStr: string | undefined) => {
    if (!groupStr) return { ageGroup: "", grade: "" };
    const lastSpaceIndex = groupStr.lastIndexOf(" ");
    if (lastSpaceIndex === -1) return { ageGroup: groupStr, grade: "" };
    return { 
        ageGroup: groupStr.substring(0, lastSpaceIndex).trim(), 
        grade: groupStr.substring(lastSpaceIndex + 1).trim() 
    };
};

export const getPlayerAgeGroup = (birthYear: number, baseYear: number) => {
    const age = baseYear - birthYear;
    return Math.floor(age / 10) * 10;
};

export const isAgeGroupValid = (
    tournamentRegion: string, 
    targetAgeGroup: { sAge: number, eAge: number }, 
    playerBirthYear: number, 
    baseYear: number
) => {
    if (!playerBirthYear) return false;
    const playerAge = baseYear - playerBirthYear;
    
    // [연령 규정: 모든 대회 공통] 
    // 본인의 나이가 신청하려는 그룹의 최소 연령(sAge)보다 '크거나 같아야' 함
    // (상위 연령대-40대-가 하위 연령대-20대-로 도전하여 지원하는 것은 가능하지만, 
    // 하위 연령대-20대-가 본인보다 나이가 많은 연령대-60대-로 지원하는 '하향 지원'은 금지)
    // 예: 25세 유저가 40세(sAge 40) 종목 신청 시: 25 >= 40 -> false (불가)
    // 예: 45세 유저가 20세(sAge 20) 종목 신청 시: 45 >= 20 -> true (가능)
    return playerAge >= targetAgeGroup.sAge;
};




export const isGradeAllowed = (
    tournamentRegion: string, 
    applyGrade: string, 
    selfGrade: string
) => {
    // 1. [공통 선출 규정] 본인이 엘리트(선출)인 경우
    if (selfGrade === "Elite") {
        // 모든 대회 공통: 자강, 준자강, Elite에만 참여 가능 (동호인 하급 부문-A/B/C/D 등- 참여 절대 불가)
        return applyGrade === "자강" || applyGrade === "준자강" || applyGrade === "Elite";
    }

    // 2. [전국대회 특별 규정]
    if (tournamentRegion === "national") {
        // 전국대회의 경우 동호인(Elite 제외)의 신청 급수 제한을 해제함 (자유로운 상/하향 지원 가능)
        return true;
    }

    // 3. [지역대회 일반 규정]
    // S와 A는 동일 등급으로 간주하여 상호 지원(S↔A) 허용
    const isSOrA = (g: string) => g === "S" || g === "A";
    if (isSOrA(selfGrade) && isSOrA(applyGrade)) return true;

    // 본인 급수 이상(상향 지원)만 신청 가능하도록 엄격히 적용
    const applyIdx = LEVEL_LIST.indexOf(applyGrade);
    const selfIdx = LEVEL_LIST.indexOf(selfGrade);
    
    if (applyIdx === -1 || selfIdx === -1) return true;
    
    // selfIdx(내 급수 인덱스)가 applyIdx(신청 금수 인덱스)보다 '크거나 같다'는 것은 
    // 내 실력이 신청 부문과 같거나 더 낮음(상향 지원)을 의미함 (HCTC 리스트 순서 기준)
    return selfIdx >= applyIdx; 
};


export const getTournamentColor = (id: string) => {
    const CARD_COLORS = ["#F1F5F8", "#C6E7EC", "#C6CFD4", "#FAF8EC", "#FFFFFF"];
    if (!id) return CARD_COLORS[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
};
