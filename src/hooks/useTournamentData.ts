import { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { saveTournament, getAllTournaments, deleteTournament } from "@/lib/firebase/tournamentService";
import { getApplicationsByTournament } from "@/lib/firebase/applicationService";
import { calculateTournamentStats, TournamentFormData } from "@/utils/tournamentUtils";
import { uploadFile } from "@/lib/firebase/storage"; 

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
                const rawApps: any[] = await getApplicationsByTournament(t.id);
                // [통합 통계 유틸 사용]
                const stats = calculateTournamentStats(rawApps);
                return { ...t, ...stats };
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
        console.log("Saving tournament started...", formData);
        try {
            const tournamentId = formData.id || `t-${Date.now()}`;
            // [임시 비활성화] 파일 업로드 기능
            /*
            let posterUrl = typeof formData.poster === 'string' ? formData.poster : "";
            let guidelineUrl = typeof formData.guideline === 'string' ? formData.guideline : "";

            if (formData.poster instanceof File) {
                console.log("Uploading poster file...", formData.poster.name);
                const extension = formData.poster.name.split('.').pop();
                const path = `tournaments/posters/${tournamentId}.${extension}`;
                const uploaded = await uploadFile(path, formData.poster);
                if (uploaded) {
                    console.log("Poster upload success:", uploaded);
                    posterUrl = uploaded;
                } else {
                    console.warn("Poster upload failed (returned null)");
                }
            }

            if (formData.guideline instanceof File) {
                console.log("Uploading guideline file...", formData.guideline.name);
                const extension = formData.guideline.name.split('.').pop();
                const path = `tournaments/guidelines/${tournamentId}.${extension}`;
                const uploaded = await uploadFile(path, formData.guideline);
                if (uploaded) {
                    console.log("Guideline upload success:", uploaded);
                    guidelineUrl = uploaded;
                } else {
                    console.warn("Guideline upload failed (returned null)");
                }
            }
            */

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
            
            // File 객체가 포함된 original formData를 spread 하기 전에 poster/guideline 값을 URL로 치유
            const submissionData = { ...formData };
            if (submissionData.poster instanceof File) delete (submissionData as any).poster;
            if (submissionData.guideline instanceof File) delete (submissionData as any).guideline;

            const tournamentData = {
                ...submissionData,
                categories,
                id: tournamentId,
                status: (formData as any).status || "open",
                updatedAt: new Date().toISOString(),
                createdAt: (formData as any).createdAt || new Date().toISOString(),
                poster: (formData.poster && typeof formData.poster === 'string' ? formData.poster : null),
                guideline: (formData.guideline && typeof formData.guideline === 'string' ? formData.guideline : null),
            };

            console.log("Sanitizing data for Firestore...", tournamentData);
            // JSON 직렬화 안정성 확보
            const jsonString = JSON.stringify(tournamentData, (key, value) => {
                if (value instanceof File) return undefined; // 실수로 남은 File 객체 제거
                return value;
            });
            const cleanData = JSON.parse(jsonString);
            
            console.log("Executing saveTournament firebase call...");
            const result = await saveTournament(cleanData);
            console.log("Firestore result:", result);
            
            if (result.success) {
                await loadTournaments(); 
                return { success: true };
            } else {
                return { success: false, error: (result.error as any)?.message || "알 수 없는 오류" };
            }
        } catch (error) {
            console.error("Save tournament critical error:", error);
            return { success: false, error: error instanceof Error ? error.message : "필수 정보 처리 중 오류가 발생했습니다." };
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
