/**
 * ExcelMappingProcessor
 * 
 * 시스템 데이터를 주최 측 엑셀 행 배열로 변환하는 순수 로직 전담 모듈입니다.
 */
export class ExcelMappingProcessor {
    private static DEFAULT_CLUB = "한콕두콕";

    /**
     * 신청 데이터를 정렬 후 엑셀 행 배열로 변환합니다.
     * 정렬 순서: 종목(남복-여복-혼복-단식) -> 연령(낮은 순) -> 급수(높은 순)
     */
    static processApplications(apps: any[]): any[][] {
        const sortedApps = [...apps].sort((a, b) => {
            // 1. 종목 정렬 (남복 > 여복 > 혼복 > 단식)
            const catOrder: Record<string, number> = { "남복": 1, "여복": 2, "혼복": 3, "남단": 4, "여단": 4, "단식": 4 };
            const getCatOrder = (c: string) => {
                const upper = (c || "").toUpperCase();
                if (["MD", "남복"].includes(upper)) return 1;
                if (["WD", "여복"].includes(upper)) return 2;
                if (["XD", "혼복"].includes(upper)) return 3;
                return 4; // 단식류
            };
            const orderA = getCatOrder(a.category);
            const orderB = getCatOrder(b.category);
            if (orderA !== orderB) return orderA - orderB;

            // 2. 연령 정렬 (낮은 순)
            const getAge = (g: string) => {
                const match = (g || "").match(/(\d+)/);
                return match ? parseInt(match[1]) : 999;
            };
            const ageA = getAge(a.group);
            const ageB = getAge(b.group);
            if (ageA !== ageB) return ageA - ageB;

            // 3. 급수 정렬 (높은 순: S > A > B > C > D)
            const gradeOrder = ["Elite", "자강", "준자강", "S", "A", "B", "C", "D", "E", "F"];
            const getGradeOrder = (g: string) => {
                const idx = gradeOrder.indexOf(g || "");
                return idx === -1 ? 999 : idx;
            };
            const gA = getGradeOrder(a.appliedGrade || "");
            const gB = getGradeOrder(b.appliedGrade || "");
            return gA - gB;
        });

        return sortedApps
            .map((app, index) => this.mapToRow(app, index + 1))
            .filter(row => row !== null);
    }

    private static mapToRow(app: any, no: number): any[] | null {
        try {
            const rawCategory = app.category || "";
            const rawGroup = app.group || "";

            // 1. 종목 코드 -> 국문 변환
            let categoryName = rawCategory;
            const catMap: Record<string, string> = {
                "MD": "남복", "남복": "남복",
                "WD": "여복", "여복": "여복",
                "XD": "혼복", "혼복": "혼복",
                "MS": "남단", "남단": "남단", "단식": "남단", "S": "남단",
                "WS": "여단", "여단": "여단"
            };
            categoryName = catMap[rawCategory.toUpperCase()] || rawCategory;

            // 2. 연령/급수 분리 (C열 연령, D열 급수)
            // rawGroup 예: "40대 A", "20 S", "30대"
            const { ageGroup, grade } = this.extractAgeAndGrade(rawGroup, app.appliedGrade);

            // 3. 필 필수값 검증 및 데이터 할당
            const p1Name = app.applicantInfo?.realName || app.userName || app.playerName || "신청자";
            const p1Phone = app.applicantInfo?.phone || app.userId || "";
            const p1Gender = app.applicantInfo?.gender === "F" || app.gender === "F" ? "여" : "남";
            const p1Birth = this.formatDate(app.applicantInfo?.birthDate || app.birthDate || "");

            if (!p1Name || !p1Phone) {
                console.warn(`[ExcelMapping] No name/phone found for No ${no}. User ID: ${app.userId}`);
            }

            // 4. 포맷팅
            const p1PhoneFormatted = this.formatPhone(p1Phone);
            
            const isSingles = ["S", "MS", "WS", "남단", "여단", "단식"].includes(categoryName);
            const isDoubles = !isSingles && (app.partnerId || app.partnerName);

            const p2Name = isDoubles ? (app.partnerInfo?.realName || app.partnerName || "") : "";
            const p2Gender = isDoubles ? (app.partnerInfo?.gender === "M" || app.partnerGender === "M" ? "남" : "여") : "";
            const p2Phone = isDoubles ? this.formatPhone(app.partnerInfo?.phone || app.partnerPhone || "") : "";
            const p2Birth = isDoubles ? this.formatDate(app.partnerInfo?.birthDate || app.partnerBirth || "") : "";

            // 5. 행 배열 생성 (17개 컬럼: A~Q)
            return [
                no,                             // A: 번호
                categoryName,                   // B: 종목(필수)
                ageGroup,                       // C: 연령(필수)
                grade,                          // D: 급수(필수)
                this.DEFAULT_CLUB,              // E: 클럽명1(필수)
                p1Name,                         // F: 선수1이름(필수)
                p1Gender,                       // G: 선수1성별(필수)
                p1Birth,                        // H: 선수1생년월일
                p1PhoneFormatted,               // I: 선수1핸드폰
                undefined,                      // J: 선수1티셔츠 (Skip)
                isSingles ? "" : this.DEFAULT_CLUB, // K: 클럽명2 (단식은 공백)
                p2Name,                         // L: 선수2이름(필수/선택)
                p2Gender,                       // M: 선수2성별(필수/선택)
                p2Birth,                        // N: 선수2생년월일
                p2Phone,                        // O: 선수2핸드폰
                undefined,                      // P: 선수2티셔츠 (Skip)
                ""                              // Q: 입금자명 (비어있음)
            ];
        } catch (err) {
            console.error(`[ExcelMapping] Error processing row ${no}:`, err);
            return null;
        }
    }

    /**
     * "40대 A" -> { ageGroup: "40", grade: "A" } 변환 유틸리티
     * [우선순위] 종목 명칭(groupStr)에서 추출한 급수가 개인 스냅샷 급수(appliedGrade)보다 우선함.
     */
    private static extractAgeAndGrade(groupStr: string, appliedGrade?: string) {
        if (!groupStr) return { ageGroup: "", grade: appliedGrade || "" };

        // 1. 연령 추출 (숫자 부분)
        const ageMatch = groupStr.match(/(\d+)/);
        const ageGroup = ageMatch ? ageMatch[1] : "";

        // 2. 급수 추출 (공백 이후의 마지막 문자열)
        const parts = groupStr.trim().split(/\s+/);
        const gradeFromGroup = parts.length > 1 ? parts[parts.length - 1] : "";
        
        // [중요] 개인 급수(B)보다 실제 종목에 기재된 급수(A)가 주최측 자료에 찍혀야 함
        return { 
            ageGroup, 
            grade: gradeFromGroup || appliedGrade || "" 
        };
    }

    private static formatPhone(phone: string): string {
        const raw = phone.replace(/[^0-9]/g, "");
        if (raw.length === 11) return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
        return phone;
    }

    private static formatDate(dateStr: string): string {
        if (!dateStr) return "";
        // YYYY-MM-DD 정규식 검사
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (regex.test(dateStr)) return dateStr;
        
        // 만약 Date 객체거나 다른 포맷일 경우 변환 시도
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toISOString().split('T')[0];
        } catch {
            return dateStr;
        }
    }
}
