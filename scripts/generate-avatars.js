/**
 * 스크립트: 아바타 이미지 분할
 * 입력: public/avatars-source.png (4열 × 5행 = 20개 캐릭터)
 * 출력: public/avatars/avatar-01.png ~ avatar-20.png (200×200px)
 *
 * 실행: node scripts/generate-avatars.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const INPUT_PATH = path.join(__dirname, "../public/avatars-source.png");
const OUTPUT_DIR = path.join(__dirname, "../public/avatars");

const COLS = 4;
const ROWS = 5;
const OUTPUT_SIZE = 200; // 각 아바타 출력 크기 (px)

async function cropAvatars() {
    // 입력 파일 존재 확인
    if (!fs.existsSync(INPUT_PATH)) {
        console.error("❌ 오류: public/avatars-source.png 파일을 찾을 수 없습니다.");
        console.error("   → 아바타 원본 이미지를 public/avatars-source.png 로 저장해주세요.");
        process.exit(1);
    }

    // 출력 폴더 생성
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`📁 폴더 생성: public/avatars/`);
    }

    // 원본 이미지 크기 읽기
    const metadata = await sharp(INPUT_PATH).metadata();
    const { width, height } = metadata;
    console.log(`📐 원본 이미지: ${width}×${height}px`);

    // 이미지 아래 watermark 제거 (하단 5% 제외)
    const usableHeight = Math.floor(height * 0.92);

    // 각 셀 크기 계산
    const cellW = Math.floor(width / COLS);
    const cellH = Math.floor(usableHeight / ROWS);
    console.log(`✂️  셀 크기: ${cellW}×${cellH}px → 출력: ${OUTPUT_SIZE}×${OUTPUT_SIZE}px\n`);

    let index = 1;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = Math.floor(col * cellW);
            const y = Math.floor(row * cellH);

            // 경계 초과 방지
            const cropW = Math.min(cellW, width - x);
            const cropH = Math.min(cellH, usableHeight - y);

            const filename = `avatar-${String(index).padStart(2, "0")}.png`;
            const outputPath = path.join(OUTPUT_DIR, filename);

            await sharp(INPUT_PATH)
                .extract({ left: x, top: y, width: cropW, height: cropH })
                .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
                    fit: "cover",
                    position: "center",
                })
                .png({ quality: 90 })
                .toFile(outputPath);

            console.log(`  ✓ [${row + 1}행 ${col + 1}열] → ${filename}`);
            index++;
        }
    }

    console.log(`\n✅ 완료! 총 ${ROWS * COLS}개 아바타 생성`);
    console.log(`   저장 위치: public/avatars/`);
}

cropAvatars().catch((err) => {
    console.error("❌ 스크립트 오류:", err.message);
    process.exit(1);
});
