import React, { useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from "@/components/ui/AppHeader";
import { getRandomAvatarByGender } from "@/lib/avatar";
import { saveUserProfile, generateUserUid, getAllUsers } from "@/lib/firebase/userService";
import { db } from "@/lib/firebase/config";
import { doc, deleteDoc } from "firebase/firestore";

const NEW_SEED_DATA = [
    { name: "전우치", nick: "도사", gender: "M", year: 1987, lv: "S", role: "master", avatar: "/avatars/avator_m_006.jpg", ph: "010-1000-0010" },
    { name: "홍련", nick: "장화홍련", gender: "F", year: 1992, lv: "A", role: "manager", avatar: "/avatars/avator_w_001.jpg", ph: "010-2222-3333" },
    { name: "농부", nick: "부지런", gender: "M", year: 1978, lv: "B", role: "manager", avatar: "/avatars/avator_m_001.jpg", ph: "010-3333-4444" },
    { name: "임꺽정", nick: "의적", gender: "M", year: 1985, lv: "B", role: "player", avatar: "/avatars/avator_m_002.jpg", ph: "010-4444-5555" },
    { name: "홍길동", nick: "번쩍", gender: "M", year: 1995, lv: "C", role: "player", avatar: "/avatars/avator_m_003.jpg", ph: "010-5555-6666" },
    { name: "박문수", nick: "어사", gender: "M", year: 1990, lv: "A", role: "player", avatar: "/avatars/avator_m_004.jpg", ph: "010-6666-7777" },
    { name: "장희빈", nick: "절세가인", gender: "F", year: 1991, lv: "B", role: "player", avatar: "/avatars/avator_w_002.jpg", ph: "010-7777-8888" },
    { name: "최무희", nick: "무희", gender: "F", year: 1994, lv: "C", role: "player", avatar: "/avatars/avator_w_003.jpg", ph: "010-8888-9999" },
    { name: "김샛별", nick: "샛별", gender: "F", year: 1996, lv: "D", role: "player", avatar: "/avatars/avator_w_004.jpg", ph: "010-9999-0000" },
    { name: "이방원", nick: "태종", gender: "M", year: 1988, lv: "S", role: "player", avatar: "/avatars/avator_m_005.jpg", ph: "010-0000-1111" },
];

export default function SeedPage() {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSeed = async () => {
        setLoading(true);
        setStatus("시작 중...");
        try {
            // 1. Get all current users to delete old phone-id keys
            setStatus("기존 데이터 확인 중...");
            const currentUsers = await getAllUsers();
            
            setStatus("기존 데이터 삭제 중...");
            for (const user of currentUsers) {
                // If ID is a phone number (contains dashes), delete it
                if (user.id.includes("-")) {
                    await deleteDoc(doc(db, "users", user.id));
                }
            }

            // 2. Seed new data with proper UIDs
            setStatus("새로운 데이터 생성 중...");
            const usedAvatars: string[] = [];
            for (const item of NEW_SEED_DATA) {
                const uid = generateUserUid(item.ph);
                const gender = item.gender as "M" | "F";
                const avatarUrl = item.avatar || getRandomAvatarByGender(gender, usedAvatars);
                usedAvatars.push(avatarUrl);

                const profile = {
                    id: uid,
                    realName: item.name,
                    nickname: item.nick,
                    gender: gender,
                    birthYear: item.year,
                    birthDate: `${item.year}-01-01`, // 추가: 생일 미정 시 01-01로 초기화
                    level: item.lv,
                    club: "한콕두콕",
                    phone: item.ph,
                    tshirtGender: gender === "M" ? "남성" : "여성",
                    tshirtSize: "L",
                    avatarUrl: avatarUrl,
                    isVerified: true,
                    isMaster: item.role === "master",
                    isManager: item.role === "master" || item.role === "manager",
                    createdAt: new Date().toISOString(),
                    totalEntries: 0
                };
                await saveUserProfile(profile as any);
            }

            setStatus("완료! 3초 후 이동합니다.");
            setTimeout(() => navigate("/admin/players"), 3000);
        } catch (error) {
            console.error(error);
            setStatus("오류 발생: " + String(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-page">
            <AppHeader />
            <div className="app-body" style={{ padding: '40px 24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Data Initialization</h1>
                <p style={{ color: '#666', marginBottom: '40px' }}>
                    기본 플레이어 데이터를 재생성합니다.<br/>
                    (기존의 휴대폰 번호 ID 데이터는 삭제되고, 새로운 UID 체계로 변경됩니다.)
                </p>
                
                <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>{status || "대기 중"}</p>
                    {loading && <div className="loading-spinner" style={{ margin: '20px auto' }}></div>}
                </div>

                <button 
                    onClick={handleSeed} 
                    disabled={loading}
                    style={{ 
                        width: '100%', 
                        padding: '20px', 
                        borderRadius: '16px', 
                        background: '#000', 
                        color: '#fff', 
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: loading ? 0.5 : 1
                    }}
                >
                    데이터 초기화 실행
                </button>
            </div>
        </div>
    );
}
