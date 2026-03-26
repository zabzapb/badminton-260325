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
    
    // [수정] 연령 자격 규정: 본인의 나이가 신청하려는 그룹의 최소 연령 이상이어야 함
    // (상위 연령대가 하위 연령대로 '내려가는' 것은 허용됨. 예: 40대가 20대로 신청 가능)
    // 하지만 20대가 60대로 신청하는 것은 불가능함
    return playerAge >= targetAgeGroup.sAge;
};




export const isGradeAllowed = (
    tournamentRegion: string, 
    applyGrade: string, 
    selfGrade: string
) => {
    // [규칙 개선] S와 A는 동일 등급으로 간주하여 상호 지원(S↔A) 허용
    const isSOrA = (g: string) => g === "S" || g === "A";
    if (isSOrA(selfGrade) && isSOrA(applyGrade)) return true;

    // 기본적으로 본인 급수 이상만 신청 가능하도록 엄격히 적용
    const applyIdx = LEVEL_LIST.indexOf(applyGrade);
    const selfIdx = LEVEL_LIST.indexOf(selfGrade);
    
    if (applyIdx === -1 || selfIdx === -1) return true;
    
    // selfIdx가 더 크거나 같다는 것은 본인이 신청 급수와 같거나 더 하위 급수(실력이 낮음)라는 뜻
    // 즉, 상향 지원만 허용하는 로직
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
