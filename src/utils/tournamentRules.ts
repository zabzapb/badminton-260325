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
    // [수정] 전국대회여도 기본적으로 본인 급수 이상만 신청 가능하도록 엄격히 적용
    const applyIdx = LEVEL_LIST.indexOf(applyGrade);
    const selfIdx = LEVEL_LIST.indexOf(selfGrade);
    
    if (applyIdx === -1 || selfIdx === -1) return true;
    
    // selfIdx가 더 크다는 것은 하위 급수라는 뜻 (LEVEL_LIST 순서상 하단)
    // 본인 급수(selfIdx)는 신청급수(applyIdx)보다 같거나 커야 함 (예: 본인 D8 >= 신청 C5)
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
