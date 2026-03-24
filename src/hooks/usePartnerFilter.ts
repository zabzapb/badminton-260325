import { useState, useEffect } from "react";
import { getAllUsers } from "@/lib/firebase/userService";
import { isGradeAllowed, isAgeGroupValid, getCategoryCode } from "@/utils/tournamentRules";

export const usePartnerFilter = (params: any) => {
    const { 
        searchQuery, selfPhone, selectedCategory, applicantGender, 
        applyGrade, selfGrade, applyAgeGroup, baseYear, tournamentRegion, 
        excludePhones = [] 
    } = params;
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    useEffect(() => {
        const fetch = async () => setAllMembers(await getAllUsers());
        fetch();
    }, []);

    const getAgeBase = (ageStr: string) => {
        const match = (ageStr || "").match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    };

    useEffect(() => {
        if (!searchQuery?.trim() || allMembers.length === 0) return setSearchResults([]);
        
        const q = searchQuery.toLowerCase();
        const excludeSet = new Set(excludePhones.map((p: string) => p.replace(/[^0-9]/g, "")));

        let filtered = allMembers.filter(m => {
            const cleanM = (m.phone || "").replace(/[^0-9]/g, "");
            const isSelf = cleanM === selfPhone?.replace(/[^0-9]/g, "");
            const isExcluded = excludeSet.has(cleanM);
            return !isSelf && !isExcluded && (
                (m.realName || "").toLowerCase().includes(q) || 
                (m.nickname || "").toLowerCase().includes(q) ||
                (m.phone || "").includes(searchQuery)
            );
        });

        // 1. Gender filter
        const catCode = getCategoryCode(selectedCategory || "");
        if (["MD", "MS"].includes(catCode)) {
            filtered = filtered.filter(m => (m.gender || "M") === "M");
        } else if (["WD", "WS"].includes(catCode)) {
            filtered = filtered.filter(m => (m.gender || "F") === "F");
        } else if (["XD"].includes(catCode)) {
            // Mixed doubles: partner must be opposite of applicant
            filtered = filtered.filter(m => (m.gender || "M") !== (applicantGender || "M"));
        }

        // 2. Grade filter - Using standard isGradeAllowed logic
        if (applyGrade) {
            filtered = filtered.filter(m => isGradeAllowed(tournamentRegion || 'local', applyGrade, m.level || "D"));
        }

        // 3. Age filter
        const applyAgeBase = getAgeBase(applyAgeGroup);
        if (applyAgeBase > 0) {
            filtered = filtered.filter(m => {
                const playerAge = m.birthYear ? (baseYear - m.birthYear) : 0;
                // [규정] 연령 대는 해당 연령대 이상이면 신청 가능 (상위 연령이 하위로 내려오는 것 허용)
                // 하지만 검색 시에는 보통 '해당 연령 그룹' 자격을 갖춘 사람만 보여줌
                // isAgeGroupValid를 쓰면 좋지만, 여기서는 간단히 나이 비교
                return playerAge >= applyAgeBase;
            });
        }
        
        setSearchResults(filtered);
    }, [searchQuery, allMembers, selectedCategory, applicantGender, applyGrade, applyAgeGroup, selfGrade, selfPhone, baseYear, tournamentRegion, excludePhones]);

    return searchResults;
};
