import ExcelJS from "exceljs";
import { ExcelMappingProcessor } from "./ExcelMappingProcessor";
import { ExcelStyleManager } from "./ExcelStyleManager";

import templatePath from "@/assets/templates/2026mapogu.xlsx?url";

/**
 * ExcelGeneratorService
 * 
 * 엑셀 생성을 총괄하는 메인 컨트롤러입니다.
 * [파일 명명 규칙] 2026_마포구_한콕두콕_YYYY-MM-DD.xlsx
 */
export class ExcelGeneratorService {
    /**
     * 최종 엑셀 파일을 생성하고 다운로드를 트리거합니다.
     */
    static async generateTournamentExcel(applications: any[], tournamentName: string = "대회") {
        try {
            // 1. 템플릿 로딩 (Browser Context)
            const templateBuffer = await this.loadTemplateAsBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(templateBuffer);
            const worksheet = workbook.worksheets[0];

            // 2. 데이터 변환 (Mapping Schema 적용 + 정렬)
            const rows = ExcelMappingProcessor.processApplications(applications);
            
            // [운영자 피드백] 실제 추출되는 팀 수 알림
            alert(`총 ${rows.length}팀의 데이터를 추출하여 엑셀 생성을 시작합니다.`);

            if (rows.length === 0) {
                console.warn("[ExcelGenerator] No valid data found for generation.");
                return;
            }

            // 3. 데이터 및 가이드 클린업 (스타일은 유지하고 값만 초기화)
            // 2행부터 500행까지의 모든 셀 내용을 비웁니다. 스타일은 보존됩니다.
            for (let i = 2; i <= 500; i++) {
                const row = worksheet.getRow(i);
                row.values = [];
            }

            // 4. 우리 데이터 덮어쓰기 (Overwrite starting from Row 2)
            rows.forEach((rowData, i) => {
                const row = worksheet.getRow(i + 2);
                row.values = rowData;
            });

            // 5. 스타일 적용 (Style Manager)
            ExcelStyleManager.applyStyles(worksheet, 2, rows.length);

            // 5. 파일명 규정 준수 ([년도]_[대회명]_[클럽명]_[날짜])
            const today = new Date().toISOString().split('T')[0];
            const year = new Date().getFullYear(); // 혹은 대회 정보에서 추출 가능
            const fileName = `${year}_${tournamentName}_한콕두콕_${today}.xlsx`;

            // 6. 파일 생성 및 저장 (Blob Download)
            const outBuffer = await workbook.xlsx.writeBuffer();
            this.downloadFile(outBuffer, fileName);

            return { success: true, count: rows.length };
        } catch (error) {
            console.error("[ExcelGenerator] Generation Failed:", error);
            throw error;
        }
    }

    private static async loadTemplateAsBuffer(): Promise<ArrayBuffer> {
        const response = await fetch(templatePath);
        if (!response.ok) {
            throw new Error(`Failed to load template from ${templatePath}`);
        }
        return await response.arrayBuffer();
    }

    private static downloadFile(buffer: ExcelJS.Buffer, fileName: string) {
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
}
