import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from "@/components/ui/Icon";
import { AppHeader } from "@/components/ui/AppHeader";
import { PlayerProfile } from "@/components/ui/PlayerProfileCard/PlayerProfileCard";
import { generateUserUid, getAllUsers } from "@/lib/firebase/userService";

const DEV_USERS: PlayerProfile[] = [
    {
        id: generateUserUid("010-1000-0010"),
        realName: "전우치",
        nickname: "도사",
        gender: "M",
        birthYear: 1987,
        birthDate: "1987-01-01",
        level: "S",
        club: "한콕두콕",
        phone: "010-1000-0010",
        tshirtGender: "남성",
        tshirtSize: "L",
        isVerified: true,
        avatarUrl: "/avatars/avator_m_006.jpg",
        avatarChangeCount: 0,
        isMaster: true,
        isManager: true,
        createdAt: new Date().toISOString()
    },
    {
        id: generateUserUid("010-2222-3333"),
        realName: "홍련",
        nickname: "장화홍련",
        gender: "F",
        birthYear: 1992,
        birthDate: "1992-01-01",
        level: "A",
        club: "한콕두콕",
        phone: "010-2222-3333",
        tshirtGender: "여성",
        tshirtSize: "M",
        isVerified: true,
        avatarUrl: "/avatars/avator_w_001.jpg",
        avatarChangeCount: 0,
        isMaster: false,
        isManager: true,
        createdAt: new Date().toISOString()
    },
    {
        id: generateUserUid("010-4444-5555"),
        realName: "임꺽정",
        nickname: "백정",
        gender: "M",
        birthYear: 1985,
        birthDate: "1985-01-01",
        level: "B",
        club: "한콕두콕",
        phone: "010-4444-5555",
        tshirtGender: "남성",
        tshirtSize: "XL",
        isVerified: true,
        avatarUrl: "/avatars/avator_m_002.jpg",
        avatarChangeCount: 0,
        isMaster: false,
        isManager: false,
        createdAt: new Date().toISOString()
    },
    {
        id: generateUserUid("010-5555-6666"),
        realName: "농부",
        nickname: "동네청년",
        gender: "M",
        birthYear: 1990,
        birthDate: "1990-01-01",
        level: "C",
        club: "한콕두콕",
        phone: "010-5555-6666",
        tshirtGender: "남성",
        tshirtSize: "L",
        isVerified: true,
        avatarUrl: "/avatars/avator_m_003.jpg",
        avatarChangeCount: 0,
        isMaster: false,
        isManager: true,
        createdAt: new Date().toISOString()
    }
];

export default function MasterLoginPage() {
    const navigate = useNavigate();
    const [users, setUsers] = React.useState<PlayerProfile[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchDevUsers = async () => {
            try {
                const allUsers = await getAllUsers() as PlayerProfile[];
                
                // 마스터/매니저 권한 사용자 우선 추출
                const managers = allUsers.filter(u => u.isMaster || u.isManager);
                
                // 그 외 모든 일반 플레이어(게스트 포함) 추출
                const otherUsers = allUsers.filter(u => !u.isMaster && !u.isManager);
                
                // 일반 플레이어 중 랜덤하게 10명 추출
                const randomGuests = otherUsers
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 10);
                
                const combined = [...managers, ...randomGuests];
                
                if (combined.length > 0) {
                    setUsers(combined);
                } else {
                    setUsers(DEV_USERS);
                }
            } catch (error) {
                console.error("Failed to fetch dev users:", error);
                setUsers(DEV_USERS);
            } finally {
                setLoading(false);
            }
        };

        fetchDevUsers();
    }, []);

    const handleLogin = (user: PlayerProfile) => {
        localStorage.setItem("hctc_user_profile", JSON.stringify(user));
        localStorage.setItem("hctc_role", user.isMaster ? "master" : user.isManager ? "manager" : "player");
        alert(`${user.realName}님(${user.isMaster ? '마스터' : user.isManager ? '매니저' : '일반'})으로 로그인했습니다.`);
        navigate("/dashboard");
    };

    return (
        <div className="app-page">
            <AppHeader showMenu={false} logoHref="/" />
            <div className="app-body">
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 className="app-body-title" style={{ marginBottom: '8px' }}>Development Login</h2>
                    <p className="app-body-subtitle" style={{ fontSize: '14px' }}>
                        개발 및 테스트를 위한 마스터 로그인 페이지입니다.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <p style={{ color: '#999' }}>사용자 목록을 불러오는 중...</p>
                        </div>
                    ) : users.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => handleLogin(user)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '20px',
                                background: '#fff',
                                border: '1px solid #eee',
                                borderRadius: '16px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.borderColor = '#FF6B3D';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = '#eee';
                            }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: '#eee', flexShrink: 0 }}>
                                <img src={user.avatarUrl || "/default-avatar.png"} alt={user.realName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{user.realName}</span>
                                    {user.isMaster && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#000080', color: '#fff', borderRadius: '4px', fontWeight: 'bold' }}>MASTER</span>}
                                    {user.isManager && !user.isMaster && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#FF6B3D', color: '#fff', borderRadius: '4px', fontWeight: 'bold' }}>MANAGER</span>}
                                </div>
                                <span style={{ color: '#999', fontSize: '14px' }}>{user.nickname} | {user.level} | {user.phone}</span>
                            </div>
                            <Icon name="arrow-right" size={20} color="#ccc" />
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: '60px', padding: '20px', background: 'rgba(255, 107, 61, 0.05)', borderRadius: '12px', border: '1px dashed #FF6B3D' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FF6B3D', marginBottom: '8px' }}>[개발자 참고] Role Policy</h3>
                    <ul style={{ fontSize: '13px', color: '#666', paddingLeft: '16px', lineHeight: '1.6' }}>
                        <li>전우치: 마스터 권한 (회원 관리, 대회 관리, 가점 부여 등)</li>
                        <li>홍련, 농부: 매니저 권한 (대회 신청 관리, 파트너 매칭 등)</li>
                        <li>임꺽정 외 7인: 일반 플레이어 (로그인, 프로필 수정, 대회 신청)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
