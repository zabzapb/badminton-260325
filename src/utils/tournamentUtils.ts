// ──────────────────────────────────────────────────────────────────────────
// Types (타입 정의)
// ──────────────────────────────────────────────────────────────────────────
export type ViewState = "list" | "form";

export interface AgeGroup {
    id: string;
    alias: string;
    startAge: number;
    endAge: number;
    birthRange: string;
    sAge: number;
    eAge: number;
}

export interface AccountInfo {
    bank: string;
    accountNumber: string;
    owner: string;
}

export interface MatrixSegment {
    id: string;
    mode: "normal" | "integrated" | "ageInput" | "yearInput";
    events: string[];
    levels: string[];
    ageGroups: AgeGroup[];
    categoryMatrix: Record<string, string[]>;
}

export interface TournamentFormData {
    id?: string;
    baseYear: number; // [추가] 대회의 기준 연도
    name: string;
    scheduleType: "1day" | "2days";
    eventDates: string[];
    deadline: string;
    venue: string;
    feeSingles: string;
    feeDoubles: string;
    account: AccountInfo;
    selectedEvents: string[];
    selectedLevels: string[];
    ageGroups: AgeGroup[];
    categoryMatrix: Record<string, string[]>;
    confirmedSegments: MatrixSegment[];
    poster?: File | string;
    guideline?: File | string;
    modeSettings?: {
        normal?: AgeGroup[];
        ageInput?: AgeGroup[];
        yearInput?: AgeGroup[];
    };
    regionType: "national" | "local";
}

// ──────────────────────────────────────────────────────────────────────────
// Constants (상수 정의)
// ──────────────────────────────────────────────────────────────────────────
export const EVENT_LIST = [
    { code: "MD", name: "MD", icon: "people" as const },
    { code: "WD", name: "WD", icon: "people" as const },
    { code: "XD", name: "XD", icon: "people" as const },
    { code: "MS", name: "MS", icon: "person" as const },
    { code: "WS", name: "WS", icon: "person" as const },
];

export const LEVEL_LIST = ["Elite", "자강", "준자강", "S", "A", "B", "C", "D", "E", "F"];

export const AGE_OPTIONS = [20, 30, 40, 45, 50, 55, 60, 65];

export const INITIAL_FORM_DATA: TournamentFormData = {
    baseYear: new Date().getFullYear(), // 실행 시점의 연도 스냅샷
    name: "",
    scheduleType: "1day",
    eventDates: [],
    deadline: "",
    venue: "",
    feeSingles: "",
    feeDoubles: "",
    account: { bank: "", accountNumber: "", owner: "" },
    selectedEvents: [],
    selectedLevels: [],
    ageGroups: [],
    categoryMatrix: {},
    confirmedSegments: [],
    modeSettings: {
        normal: [],
        ageInput: [],
        yearInput: []
    },
    regionType: "local"
};

export const AGE_COLORS = ['#F4f1ec', '#dad1c8', '#9bacd8', '#223382', '#111144', '#F98513'];

export const currentYear = 2026;

// ──────────────────────────────────────────────────────────────────────────
// Utility Functions (순수 함수)
// ──────────────────────────────────────────────────────────────────────────
export const getGradeColor = (grade: string) => {
    return '#233d4d';
};

export const getIconColorForGrade = (grade: string) => {
    const color = getGradeColor(grade);
    if (color === '#233d4d') return '#FFFFFF';
    const darkBackgrounds = ['#223382', '#111144', '#F98513'];
    return darkBackgrounds.includes(color) ? '#FFFFFF' : '#282828';
};

export const getCalculatedEndAge = (sAge: number, eAge: number, mode: 'normal' | 'integrated' = 'normal') => {
    if (eAge === 999) return 999;
    if (mode === 'integrated') {
        if (eAge === 25) return 29;
        if (eAge === 30) return 39;
        if (eAge >= 40) return eAge - 1;
        return eAge;
    }
    return eAge + (sAge === eAge ? (sAge < 40 ? 9 : 4) : 0);
};

export const getBirthRange = (sAge: number, calculatedEndAge: number, baseYear: number): string => {
    const latestYear = baseYear - sAge;
    
    if (calculatedEndAge === 999) return `${latestYear}(${sAge}세) ~`;
    
    const earliestYear = baseYear - calculatedEndAge;
    
    if (sAge === calculatedEndAge) return `${latestYear}(${sAge}세)`;
    
    const minYear = Math.min(latestYear, earliestYear);
    const maxYear = Math.max(latestYear, earliestYear);
    
    const ageForMin = baseYear - minYear;
    const ageForMax = baseYear - maxYear;
    
    return `${minYear}(${ageForMin}세) ~ ${maxYear}(${ageForMax}세)`;
};

export const formatNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, "");
    return num ? Number(num).toLocaleString() : "";
};

/**
 * [통합 통계 로직] 대회 신청 내역에서 참가팀/인원/종목별 개수를 산출합니다.
 * @param apps 신청 내역 배열
 */
export const calculateTournamentStats = (apps: any[]) => {
    // 1. 취소/거절된 내역 제외
    const activeApps = (apps || []).filter(a => a.status !== "cancelled" && a.status !== "rejected");

    const stats = {
        totalTeams: activeApps.length,
        totalPlayers: 0,
        mdCount: 0,
        wdCount: 0,
        xdCount: 0,
        sCount: 0,
        malePlayers: 0,
        femalePlayers: 0,
        uniqueParticipants: new Set<string>()
    };

    activeApps.forEach(app => {
        // 참가자 유니크 카운트용 ID 수집
        if (app.userId) stats.uniqueParticipants.add(app.userId);
        if (app.partnerId) stats.uniqueParticipants.add(app.partnerId);

        // 종목별 팀수 계산
        const cat = app.category || "";
        if (["MD", "남복"].includes(cat)) stats.mdCount++;
        else if (["WD", "여복"].includes(cat)) stats.wdCount++;
        else if (["XD", "혼복"].includes(cat)) stats.xdCount++;
        else if (["S", "MS", "WS", "단식", "MWS"].includes(cat)) stats.sCount++;

        // 인원수 합산
        if (["MD", "WD", "XD", "남복", "여복", "혼복"].includes(cat)) {
            stats.totalPlayers += 2;
        } else {
            stats.totalPlayers += 1;
        }
    });

    return {
        totalTeams: stats.totalTeams,
        totalPlayers: stats.totalPlayers,
        totalApplicants: stats.uniqueParticipants.size,
        mdCount: stats.mdCount,
        wdCount: stats.wdCount,
        xdCount: stats.xdCount,
        sCount: stats.sCount,
        // Legacy aliases for UI compatibility
        total: stats.uniqueParticipants.size,
        md: stats.mdCount,
        wd: stats.wdCount,
        xd: stats.xdCount,
        s: stats.sCount,
        // UI 연동용 필드명 (호환성 유지)
        teamStats: {
            md: stats.mdCount,
            wd: stats.wdCount,
            xd: stats.xdCount,
            s: stats.sCount
        }
    };
};
