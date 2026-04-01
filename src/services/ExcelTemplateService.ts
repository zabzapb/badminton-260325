import ExcelJS from "exceljs";

/**
 * ExcelTemplateService
 * 
 * 1단계: 템플릿 로딩 및 데이터 매핑 기본 엔진
 * [불변성 유지] 원본 템플릿은 읽기 전용으로 관리하며 메모리 상에서 작업합니다.
 */
export class ExcelTemplateService {
    private static TEMPLATE_PATH = "/src/assets/templates/2026mapogu.xlsx";
    private workbook: ExcelJS.Workbook;

    constructor() {
        this.workbook = new ExcelJS.Workbook();
    }

    /**
     * 템플릿 파일을 로드합니다.
     * 브라우저 환경에서는 readFile 대신 arrayBuffer를 사용해야 합니다.
     * 여기서는 서버리스/노드 환경 혹은 로컬 테스트 환경을 가정하여 구조를 설계합니다.
     */
    async loadTemplate(buffer?: ArrayBuffer) {
        if (buffer) {
            await this.workbook.xlsx.load(buffer);
        } else {
            // Node.js 환경 예시 (CLI 테스트 등)
            try {
                const path = await import("path");
                const fs = await import("fs");
                const fullPath = path.join(process.cwd(), ExcelTemplateService.TEMPLATE_PATH);
                if (fs.existsSync(fullPath)) {
                    await this.workbook.xlsx.readFile(fullPath);
                }
            } catch (e) {
                console.warn("Local template file not found, assuming browser context.");
            }
        }
        return this.workbook.getWorksheet(1);
    }

    /**
     * 매핑 스키마 (Mapping Schema Report)
     * 분석 결과 기반 컬럼 정의
     */
    getMappingSchema() {
        return {
            columns: {
                A: { index: 1, key: "no", name: "번호" },
                B: { index: 2, key: "category", name: "종목(필수)" },
                C: { index: 3, key: "ageGroup", name: "연령(필수)" },
                D: { index: 4, key: "grade", name: "급수(필수)" },
                E: { index: 5, key: "club1", name: "클럽명1(필수)", defaultValue: "한콕두콕" },
                F: { index: 6, key: "player1Name", name: "선수1이름(필수)" },
                G: { index: 7, key: "player1Gender", name: "선수1성별(필수)" },
                H: { index: 8, key: "player1Birth", name: "선수1생년월일" },
                I: { index: 9, key: "player1Phone", name: "선수1핸드폰" },
                J: { index: 10, key: "player1TSize", name: "선수1티셔츠(숨김)", skip: true },
                K: { index: 11, key: "club2", name: "클럽명2(필수)", defaultValue: "한콕두콕" },
                L: { index: 12, key: "player2Name", name: "선수2이름(선택)" },
                M: { index: 13, key: "player2Gender", name: "선수2성별(선택)" },
                N: { index: 14, key: "player2Birth", name: "선수2생년월일(선택)" },
                O: { index: 15, key: "player2Phone", name: "선수2핸드폰(선택)" },
                P: { index: 16, key: "player2TSize", name: "선수2티셔츠(숨김)", skip: true },
                Q: { index: 17, key: "depositor", name: "입금자명" },
            },
            dataStartRow: 2, // 헤더 다음 행부터 데이터 시작
            fonts: {
                default: "맑은 고딕",
                size: 10
            }
        };
    }
}
