import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AppHeader } from "@/components/ui/AppHeader";
import { Icon } from "@/components/ui/Icon";
import { PlayerProfileCard, PlayerProfile } from "@/components/ui/PlayerProfileCard/PlayerProfileCard";
import { getAllUsers } from "@/lib/firebase/userService";
import { ExcelUploadButton } from "@/components/ui/ExcelUpload/ExcelUploadButton";

export default function PlayerListPage() {
    const navigate = useNavigate();
    const [players, setPlayers] = useState<PlayerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isMaster, setIsMaster] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<string>("All");
    const [sortBy, setSortBy] = useState<"name" | "recent" | "random">("random");

    useEffect(() => {
        const stored = localStorage.getItem("hctc_user_profile");
        if (stored) {
            const parsed = JSON.parse(stored);
            const master = !!parsed.isMaster;
            const manager = !!parsed.isManager;
            setIsMaster(master);
            setIsManager(manager);
        }
    }, []);

    const fetchPlayers = async () => {
        setLoading(true);
        try {
            const fetchedPlayers = await getAllUsers() as PlayerProfile[];
            setPlayers(fetchedPlayers);
        } catch (error) {
            console.error("Error fetching players:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlayers();

        const handleFocus = () => fetchPlayers();
        window.addEventListener("focus", handleFocus);

        const handleReset = () => {
            setSelectedLevel("All");
            setSearchTerm("");
        };
        window.addEventListener("reset-player-view", handleReset);
        return () => {
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("reset-player-view", handleReset);
        };
    }, []);

    const filteredPlayers = players.filter(p => {
        const name = (p.realName || "").toLowerCase();
        const nick = (p.nickname || "").toLowerCase();
        const search = searchTerm.toLowerCase();

        const matchesSearch = name.includes(search) || 
            nick.includes(search) ||
            (p.phone || "").includes(searchTerm);
        
        if (searchTerm) return matchesSearch;
        
        const matchesLevel = selectedLevel === "All" 
            ? true 
            : selectedLevel === "Manager"
                ? (p.isMaster || p.isManager)
                : (p.level || "D") === selectedLevel;
        return matchesLevel;
    });

    const sortedPlayers = filteredPlayers; // Shuffled once during fetch or filtered directly

    return (
        <div className="app-page">
            <AppHeader />
            <div className="app-body" style={{ padding: '24px', paddingBottom: '80px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 className="app-body-title" style={{ marginBottom: '12px' }}>한콕두콕 플레이어</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1C1C1E', flexWrap: 'wrap', fontWeight: 700 }}>
                        {!searchTerm && selectedLevel === "All" ? (
                            <span>{players.length}</span>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#FF6B3D' }}>{filteredPlayers.length}</span>
                                <span style={{ color: '#8E8E93', fontWeight: 400 }}>/</span>
                                <span style={{ color: '#8E8E93', fontWeight: 400 }}>{players.length}</span>
                            </div>
                        )}
                        <span style={{ color: '#C7C7CC', fontWeight: 300, margin: '0 4px' }}>|</span>
                        {["All", "S", "A", "B", "C", "D", "E", "F", "Manager"].map(lv => (
                            <button 
                                key={lv}
                                onClick={() => setSelectedLevel(lv)} 
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    padding: '4px 2px', 
                                    color: selectedLevel === lv ? "#FF6B3D" : "#8E8E93", 
                                    fontWeight: selectedLevel === lv ? 800 : 400, 
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                {lv}
                            </button>
                        ))}
                        {isMaster && (
                            <>
                                <span>|</span>
                                <Link to="/admin/cleanup" style={{ color: '#ccc', textDecoration: 'none' }}>Admin</Link>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                    <div className="search-bar" style={{ 
                        flex: 1,
                        background: '#fff', 
                        border: '1px solid #C7C7CC',
                        borderRadius: '8px', 
                        height: '56px',
                        padding: '0 16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                    }}>
                        <Icon name="search" size={20} color="#999" />
                        <input 
                            type="text" 
                            placeholder="이름, 닉네임, 연락처로 검색" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '16px', height: '100%' }}
                        />
                    </div>
                    {(isMaster || isManager) && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={() => navigate('/admin/players/new')}
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    background: '#FF6B3D',
                                    borderRadius: '8px',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                                title="개별 등록"
                            >
                                <Icon name="person-add" size={24} color="#fff" />
                            </button>
                            <ExcelUploadButton onUploadComplete={fetchPlayers} />
                        </div>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <p style={{ color: '#999' }}>불러오는 중...</p>
                    </div>
                ) : filteredPlayers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '120px 0' }}>
                        <Icon name="search" size={48} color="#D1D1D6" style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p style={{ color: '#8E8E93', fontSize: '15px' }}>해당하는 플레이어가 없습니다.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {sortedPlayers.map((player, idx) => {
                            const canEdit = isMaster || (isManager && !player.isMaster);
                            
                            return (
                                <div 
                                    key={player.id} 
                                    style={{ 
                                        borderBottom: idx === sortedPlayers.length - 1 ? 'none' : '0.5px solid rgba(0, 0, 0, 0.15)',
                                        paddingBottom: '16px',
                                        marginBottom: '16px',
                                        cursor: canEdit ? 'pointer' : 'default'
                                    }}
                                    onClick={() => {
                                        if (canEdit) {
                                            navigate(`/admin/players/${player.id}/edit`);
                                        }
                                    }}
                                >
                                    <PlayerProfileCard 
                                        profile={player} 
                                        showEntry={true}
                                        showRoleBadge={true}
                                        // Not passing onAvatarClick here because we handle click at the container level
                                        // and we don't want the settings icon to show in the player list.
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
