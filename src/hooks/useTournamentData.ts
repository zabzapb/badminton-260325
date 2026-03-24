import { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { saveTournament, getAllTournaments, deleteTournament } from "@/lib/firebase/tournamentService";
import { getApplicationsByTournament } from "@/lib/firebase/applicationService";
import { TournamentFormData } from "@/utils/tournamentUtils";

export const useTournamentData = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [apps, setApps] = useState<any[]>([]);
    const [fetchingApps, setFetchingApps] = useState(false);

    // 1. 초기 권한 체크 및 대회 목록 로딩
    useEffect(() => {
        const checkPermission = () => {
            const stored = localStorage.getItem("hctc_user_profile");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (!parsed.isMaster && !parsed.isManager) {
                    alert("대회 등록/관리 권한이 없습니다.");
                    navigate("/dashboard");
                    return false;
                }
                return true;
            }
            navigate("/dashboard");
            return false;
        };

        if (checkPermission()) {
            loadTournaments();
        }
    }, [navigate]);

    // 2. 대회 목록 및 신청자 수 통계 불러오기
    const loadTournaments = async () => {
        try {
            const fbTournaments = await getAllTournaments();
            const enrichedTournaments = await Promise.all(fbTournaments.map(async (t: any) => {
                const tApps: any[] = await getApplicationsByTournament(t.id);
                const mdCount = tApps.filter(a => a.category === "MD").length;
                const wdCount = tApps.filter(a => a.category === "WD").length;
                const xdCount = tApps.filter(a => a.category === "XD").length;
                const sCount = tApps.filter(a => a.category === "MWS" || a.category === "S").length;
                
                const totalTeams = tApps.length;
                const totalPlayers = tApps.reduce((acc, a) => {
                    if (["MD", "WD", "XD"].includes(a.category)) return acc + 2;
                    return acc + 1;
                }, 0);

                return { ...t, totalTeams, totalPlayers, mdCount, wdCount, xdCount, sCount };
            }));
            setTournaments(enrichedTournaments);
        } catch (error) {
            console.error("Load tournaments error:", error);
            setTournaments([]);
        }
    };

    // 3. 특정 대회의 신청자 목록 불러오기
    const loadApplications = useCallback(async (tournamentId: string) => {
        setFetchingApps(true);
        try {
            const result = await getApplicationsByTournament(tournamentId);
            setApps(result);
        } catch (err) {
            console.error("Error fetching apps:", err);
        } finally {
            setFetchingApps(false);
        }
    }, []);

    // 4. 대회 정보 저장 로직
    const saveTournamentData = async (formData: TournamentFormData) => {
        try {
            const categoryMap: Record<string, string[]> = {};
            (formData.confirmedSegments || []).forEach(seg => {
                const type = (seg.events || [])[0];
                const level = (seg.levels || [])[0];
                if (!type || !level) return;
                if (!categoryMap[type]) categoryMap[type] = [];
                (seg.ageGroups || []).forEach(ag => {
                    const groupStr = `${ag.alias.replace('~', '').trim()} ${level}`;
                    if (!categoryMap[type].includes(groupStr)) categoryMap[type].push(groupStr);
                });
            });
            const categories = Object.keys(categoryMap).map(type => ({ type, groups: categoryMap[type] }));
            
            const tournamentData = {
                ...formData,
                categories,
                id: formData.id || `t-${Date.now()}`,
                status: (formData as any).status || "open",
                createdAt: (formData as any).createdAt || new Date().toISOString(),
                poster: typeof formData.poster === 'string' ? formData.poster : null,
                guideline: typeof formData.guideline === 'string' ? formData.guideline : null,
            };

            const cleanData = JSON.parse(JSON.stringify(tournamentData));
            const result = await saveTournament(cleanData);
            
            if (result.success) {
                await loadTournaments(); // 저장 성공 시 목록 새로고침
                return { success: true };
            } else {
                return { success: false, error: (result.error as any)?.message || "알 수 없는 오류" };
            }
        } catch (error) {
            console.error("Save tournament error:", error);
            return { success: false, error: "처리 중 유효하지 않은 요청이 발생했습니다." };
        }
    };

    // 5. 대회 정보 삭제 로직
    const deleteTournamentData = async (id: string) => {
        try {
            const result = await deleteTournament(id);
            if (result.success) {
                await loadTournaments(); // 삭제 성공 시 목록 새로고침
                return { success: true };
            }
            return { success: false, error: "삭제 중 오류가 발생했습니다." };
        } catch (error) {
            console.error("Delete tournament error:", error);
            return { success: false, error: "삭제 중 오류 발생" };
        }
    };

    return {
        tournaments,
        apps,
        fetchingApps,
        loadApplications,
        saveTournamentData,
        deleteTournamentData
    };
};
