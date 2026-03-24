"use client";
import React, { useRef, useState } from "react";
import { Icon } from "../Icon";
import { UserProfile, saveUserProfile, generateUserUid } from "@/lib/firebase/userService";

interface ExcelUploadButtonProps {
    onUploadComplete: () => void;
}

export function ExcelUploadButton({ onUploadComplete }: ExcelUploadButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            if (!(window as any).XLSX) {
                const script = document.createElement("script");
                script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
                await new Promise((resolve) => {
                    script.onload = resolve;
                    document.head.appendChild(script);
                });
            }

            const XLSX = (window as any).XLSX;
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            // 🌟 수정된 부분 1: 엑셀 날짜 형식을 무조건 'YYYY-MM-DD' 문자열로 읽어오도록 옵션 추가
            const json = XLSX.utils.sheet_to_json(sheet, { 
                raw: false, 
                dateNF: 'yyyy-mm-dd' 
            }) as any[];

            if (json.length === 0) {
                alert("엑셀 파일에 데이터가 없습니다.");
                setIsUploading(false);
                return;
            }

            const currentYear = new Date().getFullYear();
            const players: any[] = json.map((row: any) => {
                const phone = String(row["연락처"] || row["전화번호"] || "").replace(/[^0-9]/g, "");
                const gender = (row["성별"] === "여" || row["성별"] === "F") ? "F" : "M";
                
                const rawBirth = String(row["생년월일"] || row["출생연도"] || row["나이"] || row["년생"] || row["생신"] || "");
                let birthYear = 0;

                if (rawBirth.includes("-")) {
                    birthYear = Number(rawBirth.split("-")[0]);
                } else {
                    const num = parseInt(rawBirth.replace(/[^0-9]/g, ""), 10);
                    if (num > 1900 && num <= currentYear) {
                        birthYear = num;
                    } else if (num > 0 && num < 120) {
                        birthYear = currentYear - num;
                    } else if (num >= 600000 && num <= 999999) {
                        const prefix = Math.floor(num / 10000);
                        birthYear = prefix > (currentYear % 100) ? 1900 + prefix : 2000 + prefix;
                    }
                }
                
                let birthDate = `${birthYear}-01-01`;
                if (rawBirth.includes("-") && rawBirth.length >= 10) {
                    birthDate = rawBirth.substring(0, 10);
                }
                
                const rawLevel = String(row["급수"] || "D").trim();
                const level = (rawLevel === "초심" || rawLevel === "초보") ? "E" : (rawLevel.toUpperCase().includes("E") ? "E" : rawLevel.toUpperCase());

                return {
                    realName: String(row["성함"] || row["이름"] || row["실명"] || "").trim(),
                    nickname: String(row["닉네임"] || ""),
                    gender,
                    birthYear,
                    birthDate, 
                    level,     
                    club: String(row["클럽"] || row["소속"] || "").trim(),
                    phone,
                    tshirtGender: (gender === "F") ? "여성" : "남성",
                    tshirtSize: String(row["사이즈"] || row["티셔츠"] || "L").toUpperCase().trim(),
                    isVerified: false,
                    isManager: false,
                    isMaster: false,
                    createdAt: new Date().toISOString(),
                    avatarUrl: "" 
                };
            });

            // Validation
            const validPlayers = players.filter(p => p.realName && p.phone && p.birthYear);
            
            // 🌟 수정된 부분 2: 누락된 데이터가 몇 명인지 친절하게 알려주는 로직 추가
            const droppedCount = players.length - validPlayers.length;

            if (validPlayers.length === 0) {
                alert("유효한 플레이어 데이터가 없습니다.\n(성함, 연락처, 생년월일은 필수입니다)");
                setIsUploading(false);
                return;
            }

            let confirmMessage = `${validPlayers.length}명의 플레이어를 등록하시겠습니까?`;
            if (droppedCount > 0) {
                confirmMessage = `엑셀의 총 ${players.length}명 중 필수 정보(이름, 연락처, 생년월일)가 없거나 오류가 있는 ${droppedCount}명이 제외되었습니다.\n\n나머지 정상 데이터 ${validPlayers.length}명을 등록하시겠습니까?`;
            }

            if (window.confirm(confirmMessage)) {
                let successCount = 0;
                for (const player of validPlayers) {
                    const result = await saveUserProfile(player);
                    if (result.success) successCount++;
                }

                alert(`${successCount}명의 플레이어가 등록되었습니다.`);
                onUploadComplete();
            }

        } catch (error) {
            console.error("Excel upload error:", error);
            alert("엑셀 처리 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange}
            />
            <button 
                onClick={handleButtonClick}
                disabled={isUploading}
                style={{
                    width: '56px',
                    height: '56px',
                    background: '#233d4d',
                    borderRadius: '8px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isUploading ? 'default' : 'pointer',
                    flexShrink: 0,
                    opacity: isUploading ? 0.6 : 1
                }}
                title="엑셀 업로드"
            >
                {isUploading ? (
                    <div className="loader-dots small" />
                ) : (
                    <Icon name="spreadsheet" size={24} color="#fff" />
                )}
            </button>
        </>
    );
}
