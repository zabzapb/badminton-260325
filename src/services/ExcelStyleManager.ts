import { Worksheet, Alignment, Border } from "exceljs";

/**
 * ExcelStyleManager
 * 
 * 템플릿의 심미성을 보존하고 가독성을 높이는 스타일 전담 모듈입니다.
 */
export class ExcelStyleManager {
    /**
     * 삽입된 데이터 행에 스타일을 일괄 적용합니다.
     */
    static applyStyles(worksheet: Worksheet, startRow: number, rowCount: number) {
        const DEFAULT_ALIGNMENT: Partial<Alignment> = {
            vertical: "middle",
            horizontal: "center"
        };

        const BORDER_STYLE: Partial<Border> = {
            style: "thin",
            color: { argb: "000000" }
        };

        // 데이터가 삽입된 모든 행에 스타일 적용
        for (let r = startRow; r < startRow + rowCount; r++) {
            const row = worksheet.getRow(r);
            
            // 모든 셀(A~Q, 1~17) 순회
            for (let c = 1; c <= 17; c++) {
                const cell = row.getCell(c);
                
                // 1. 중앙 정렬 (기본) + 텍스트 너비 맞춤(Shrink to fit)
                cell.alignment = { 
                    ...DEFAULT_ALIGNMENT,
                    shrinkToFit: true 
                };

                // 2. 테두리 적용 (Thin 스타일)
                cell.border = {
                    top: BORDER_STYLE,
                    left: BORDER_STYLE,
                    bottom: BORDER_STYLE,
                    right: BORDER_STYLE
                };

                // 3. 폰트 상속 - 주최측 양식 유지
                // (일반적으로 상속되나 필요 시 수동 정의 가능)
            }
        }
    }

    /**
     * 컬럽 너비 동적 조정 (Auto-fit 기반)
     */
    static adjustColumnWidths(worksheet: Worksheet) {
        worksheet.columns.forEach(column => {
            let maxLen = 0;
            column.eachCell?.({ includeEmpty: true }, cell => {
                const len = cell.value ? cell.value.toString().length : 0;
                if (len > maxLen) maxLen = len;
            });
            // 한글 포함 고려하여 보정치 적용
            column.width = Math.max(10, maxLen * 1.5);
        });
    }
}
