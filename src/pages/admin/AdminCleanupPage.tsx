import React, { useState, useEffect } from "react";
import { getAllUsers, deleteUserProfile, UserProfile, saveUserProfile } from "@/lib/firebase/userService";
import { AppHeader } from "@/components/ui/AppHeader";

export default function CleanupPage() {
    const [players, setPlayers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");

    useEffect(() => {
        const fetchPlayers = async () => {
            const all = await getAllUsers();
            // Sort by createdAt ascending (oldest first)
            const sorted = [...all].sort((a: any, b: any) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateA - dateB;
            });
            setPlayers(sorted);
            setLoading(false);
        };
        fetchPlayers();
    }, []);

    const handleCleanup = async () => {
        if (!window.confirm(`상위 10명을 제외한 ${players.length - 10}명을 삭제하시겠습니까?`)) return;
        
        setStatus("삭제 작업 중...");
        const toDelete = players.slice(10);
        let count = 0;

        for (const p of toDelete) {
            await deleteUserProfile(p.id);
            count++;
            setStatus(`삭제 중... (${count}/${toDelete.length})`);
        }

        setStatus(`완료! ${count}명이 삭제되었습니다.`);
        // Reload list
        const all = await getAllUsers();
        setPlayers(all);
    };

    const handleMigrateToPlayer = async () => {
        const toMigrate = players.filter(p => !p.isMaster && !p.isManager && !p.isVerified);
        if (toMigrate.length === 0) return alert("일괄 변경할 게스트 대상이 없습니다.");
        
        if (!window.confirm(`${toMigrate.length}명의 게스트를 모두 'Player(인증회원)' 권한으로 일괄 변경하시겠습니까?`)) return;
        
        setStatus("권한 일괄 변경 중...");
        let count = 0;

        for (const p of toMigrate) {
            const result = await saveUserProfile({
                ...p,
                isVerified: true,
                isManager: false,
                isMaster: false
            } as any);
            if (result.success) count++;
            setStatus(`변경 중... (${count}/${toMigrate.length})`);
        }

        setStatus(`완료! ${count}명의 권한이 'Player'로 변경되었습니다.`);
        const all = await getAllUsers();
        setPlayers(all);
    };

    const handleMigrateBirthDate = async () => {
        if (!window.confirm(`현재 등록된 ${players.length}명의 데이터 중 생년월일이 누락된 항목을 보정하시겠습니까?\n(YYYY-01-01 형식으로 채워집니다)`)) return;
        
        setStatus("데이터 보정 작업 중...");
        let count = 0;
        const toFix = players.filter(p => !p.birthDate && p.birthYear);

        for (const p of toFix) {
            const result = await saveUserProfile({
                ...p,
                birthDate: `${p.birthYear}-01-01`
            } as any);
            if (result.success) count++;
            setStatus(`보정 중... (${count}/${toFix.length})`);
        }

        setStatus(`완료! ${count}명의 데이터가 보정되었습니다.`);
        // Reload list
        const all = await getAllUsers();
        setPlayers(all);
    };

    return (
        <div className="app-page">
            <AppHeader />
            <div className="app-body" style={{ padding: '24px' }}>
                <h2 className="app-body-title">데이터 정리 및 보정</h2>
                
                <div style={{ marginBottom: '32px', background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #E5E5EA' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>1. 플레이어 권한 일괄 부여</h3>
                    <p style={{ color: '#666', marginBottom: '16px' }}>
                        현재 '게스트' 상태인 플레이어들을 모두 **'Player(인증회원)'** 상태로 일괄 변경합니다.<br/>
                        (엑셀로 대량 등록한 선수들을 정식 회원으로 전환할 때 사용합니다.)
                    </p>
                    <button 
                        onClick={handleMigrateToPlayer}
                        style={{ background: '#34C759', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        모든 게스트를 'Player'로 일괄 변경
                    </button>
                    <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '8px' }}>
                        * 대상 인원: {players.filter(p => !p.isMaster && !p.isManager && !p.isVerified).length}명
                    </p>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>2. 생년월일 데이터 일괄 보정</h3>
                    <p style={{ color: '#666', marginBottom: '16px' }}>
                        기존 데이터 중 `birthDate`가 없고 연도(`birthYear`)만 있는 플레이어를 찾아 `YYYY-01-01`로 채워줍니다.
                    </p>
                    <button 
                        onClick={handleMigrateBirthDate}
                        style={{ background: '#007AFF', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        생년월일 누락 데이터 일괄 보정 실행
                    </button>
                    {status && <p style={{ color: '#FF6B3D', fontWeight: 'bold', marginTop: '12px' }}>{status}</p>}
                </div>

                <div style={{ padding: '32px 0', borderTop: '1px solid #E5E5EA', marginTop: '32px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>3. 데이터 정리 (Cleanup)</h3>
                    <p style={{ color: '#666', marginBottom: '16px' }}>
                        등록된 플레이어 중 가장 오래된 10명만 남기고 나머지를 일괄 삭제합니다.
                    </p>
                    <button 
                        onClick={handleCleanup}
                        style={{ background: '#FF3B30', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        상위 10개 제외 일괄 삭제 실행
                    </button>
                </div>

                <div style={{ marginTop: '32px', background: '#f5f5f7', padding: '20px', borderRadius: '16px' }}>
                    <p><strong>전체 인원:</strong> {players.length}명</p>
                    <p><strong>보정이 필요한 인원:</strong> {players.filter(p => !p.birthDate && p.birthYear).length}명</p>
                    <p style={{ fontSize: '12px', color: '#8E8E93' }}>- 이미 보정된 인원: {players.filter(p => !!p.birthDate).length}명</p>
                    <p style={{ fontSize: '12px', color: '#8E8E93' }}>- 출생연도 정보가 없는 인원 (보정 불가): {players.filter(p => !p.birthDate && !p.birthYear).length}명</p>
                </div>
            </div>
        </div>
    );
}
