import { useState } from "react";
import { 
    AgeGroup, MatrixSegment, TournamentFormData, INITIAL_FORM_DATA, 
    getCalculatedEndAge, getBirthRange 
} from "@/utils/tournamentUtils";

export const useTournamentForm = () => {
    // 1. 상태(State) 관리
    const [formData, setFormData] = useState<TournamentFormData>(INITIAL_FORM_DATA);
    const [ageMode, setAgeMode] = useState<"normal" | "integrated" | "ageInput" | "yearInput" | null>(null);
    const [aliasInput, setAliasInput] = useState("");
    const [customStartAge, setCustomStartAge] = useState(20);
    const [customEndAge, setCustomEndAge] = useState(29);
    const [customStartYear, setCustomStartYear] = useState(new Date().getFullYear() - 20);
    const [customEndYear, setCustomEndYear] = useState(new Date().getFullYear() - 29);
    const [isMatrixConfirmed, setIsMatrixConfirmed] = useState(false);
    const [editingEvent, setEditingEvent] = useState<string | null>(null);

    // 2. 폼 조작 로직 (기존 함수들 그대로 이동)
    const toggleEvent = (code: string) => { 
        setFormData(prev => { 
            const next = prev.selectedEvents?.includes(code) ? prev.selectedEvents.filter(c => c !== code) : [...(prev.selectedEvents || []), code]; 
            return { ...prev, selectedEvents: next }; 
        }); 
    };
    
    const toggleLevel = (lv: string) => { 
        setFormData(prev => { 
            const next = prev.selectedLevels?.includes(lv) ? prev.selectedLevels.filter(l => l !== lv) : [...(prev.selectedLevels || []), lv]; 
            return { ...prev, selectedLevels: next }; 
        }); 
    };

    const recalculateAgeGroups = (groups: AgeGroup[]) => {
        if (ageMode !== 'integrated') return groups;
        const sorted = [...groups].sort((a, b) => a.sAge - b.sAge);
        return sorted.map((g, idx) => {
            const nextG = sorted[idx + 1];
            const baseEndAge = getCalculatedEndAge(g.sAge, g.eAge, 'integrated');
            const refinedEndAge = nextG ? Math.min(baseEndAge, nextG.sAge - 1) : baseEndAge;
            return {
                ...g,
                startAge: g.sAge,
                endAge: refinedEndAge,
                birthRange: getBirthRange(g.sAge, refinedEndAge, formData.baseYear)
            };
        });
    };

    const addAgeGroup = (sVal: number, eVal: number, alias?: string) => {
        const id = `ag-${sVal}-${eVal}-${Date.now()}`;
        const mode = ageMode;
        let startAgeVal = sVal;
        let endAgeVal = eVal;
        let birthRangeVal = "";
        let aliasValue = alias || "";

        if (mode === 'yearInput') {
            const minYear = Math.min(sVal, eVal);
            const maxYear = Math.max(sVal, eVal);
            const ageForMin = formData.baseYear - minYear;
            const ageForMax = formData.baseYear - maxYear;
            birthRangeVal = minYear === maxYear ? `${maxYear}(${ageForMax}세)` : `${maxYear}(${ageForMax}세) ~ ${minYear}(${ageForMin}세)`;
            aliasValue = alias || birthRangeVal;
            startAgeVal = ageForMax;
            endAgeVal = ageForMin;
        } else if (mode === 'ageInput') {
            startAgeVal = sVal;
            endAgeVal = eVal;
            birthRangeVal = sVal === eVal ? `${sVal}세` : `${sVal} ~ ${eVal}세`;
            aliasValue = alias || (sVal === eVal ? `${sVal}` : `${sVal}~${eVal}`);
        } else {
            const calcEndAge = (mode === 'normal' || mode === 'integrated') 
                ? getCalculatedEndAge(sVal, eVal, mode === 'integrated' ? 'integrated' : 'normal')
                : eVal;
            startAgeVal = sVal;
            endAgeVal = calcEndAge;
            birthRangeVal = getBirthRange(sVal, calcEndAge, formData.baseYear);
            aliasValue = alias || (sVal === calcEndAge ? `${sVal}` : (calcEndAge === 999 ? `${sVal} ~` : `${sVal} ~ ${calcEndAge}`));
        }

        const newGroupEntry: AgeGroup = { id, alias: aliasValue, startAge: startAgeVal, endAge: endAgeVal, birthRange: birthRangeVal, sAge: sVal, eAge: eVal };

        setFormData(prev => {
            const nextGroups = mode === 'integrated' ? recalculateAgeGroups([...prev.ageGroups, newGroupEntry]) : [...prev.ageGroups, newGroupEntry];
            const nextMatrix = { ...prev.categoryMatrix };
            nextMatrix[id] = [...(prev.selectedEvents || [])];
            const nextModeSettings = { ...(prev.modeSettings || {}) };
            if (mode) nextModeSettings[mode as keyof typeof nextModeSettings] = nextGroups;
            return { ...prev, ageGroups: nextGroups, categoryMatrix: nextMatrix, modeSettings: nextModeSettings };
        });
    };

    const toggleAgeConfigGroup = (age: number) => {
        setFormData(prev => {
            const existingIdx = prev.ageGroups.findIndex(g => g.sAge === age && g.eAge === age);
            const nextModeSettings = { ...(prev.modeSettings || {}) };
            if (existingIdx !== -1) {
                const nextGroups = [...prev.ageGroups];
                nextGroups.splice(existingIdx, 1);
                if (ageMode) nextModeSettings[ageMode as keyof typeof nextModeSettings] = nextGroups;
                return { ...prev, ageGroups: nextGroups, modeSettings: nextModeSettings };
            } else {
                const id = `ag-${age}-${age}-${crypto.randomUUID()}`;
                const newGroup: AgeGroup = { id, alias: `${age}`, startAge: age, endAge: age, birthRange: getBirthRange(age, age, formData.baseYear), sAge: age, eAge: age };
                const nextMatrix = { ...prev.categoryMatrix };
                nextMatrix[id] = [...prev.selectedEvents];
                const nextGroups = [...prev.ageGroups, newGroup];
                if (ageMode) nextModeSettings[ageMode as keyof typeof nextModeSettings] = nextGroups;
                return { ...prev, ageGroups: nextGroups, categoryMatrix: nextMatrix, modeSettings: nextModeSettings };
            }
        });
    };

    const toggleEventInMatrix = (ageGroupId: string, eventCode: string) => {
        setFormData(prev => {
            const currentSelected = prev.categoryMatrix[ageGroupId] || [];
            const newSelected = currentSelected.includes(eventCode) ? currentSelected.filter(c => c !== eventCode) : [...currentSelected, eventCode];
            return { ...prev, categoryMatrix: { ...prev.categoryMatrix, [ageGroupId]: newSelected } };
        });
    };

    const handleSaveSegment = () => {
        const isEliteOnly = formData.selectedLevels.length > 0 && formData.selectedLevels.every(l => l === "자강" || l === "준자강");
        if (formData.selectedEvents.length === 0 || formData.selectedLevels.length === 0 || (!isEliteOnly && formData.ageGroups.length === 0)) {
            alert("종목, 급수, 그리고 연령대를 모두 설정해주세요.");
            return;
        }

        let processedGroups: AgeGroup[] = [];
        if (ageMode !== 'normal') {
            processedGroups = [...formData.ageGroups];
        } else {
            const sortedGroups = [...formData.ageGroups].sort((a, b) => a.startAge - b.startAge);
            processedGroups = sortedGroups.map((group, idx) => {
                const nextGroup = sortedGroups[idx + 1];
                const dynamicEndAgeParam = nextGroup ? nextGroup.startAge - 1 : 999;
                const finalEndAge = getCalculatedEndAge(group.startAge, dynamicEndAgeParam, 'normal');
                return { ...group, endAge: finalEndAge, birthRange: getBirthRange(group.startAge, finalEndAge, formData.baseYear) };
            });
        }

        setFormData(prev => {
            let nextSegments = [...prev.confirmedSegments];

            prev.selectedEvents.forEach(evCode => {
                prev.selectedLevels.forEach(lvCode => {
                    let finalGroups = [...processedGroups];
                    if (lvCode === "자강" || lvCode === "준자강") {
                        finalGroups = [{ id: `ag-fixed-20-${crypto.randomUUID()}`, alias: "20", startAge: 20, endAge: 999, birthRange: getBirthRange(20, 999, prev.baseYear), sAge: 20, eAge: 20 }];
                    }

                    // [개선] 이미 동일 종목/급수가 설정되어 있는지 확인
                    const existingIdx = nextSegments.findIndex(s => s.events.includes(evCode) && s.levels.includes(lvCode));

                    if (existingIdx !== -1) {
                        // 기존 세그먼트에 연령대 추가 병합
                        const existing = nextSegments[existingIdx];
                        let mergedGroups = [...existing.ageGroups];
                        const mergedMatrix = { ...existing.categoryMatrix };

                        finalGroups.forEach(g => {
                            // 중복 체크 (alias 기준)
                            if (!mergedGroups.some(eg => eg.alias === g.alias)) {
                                mergedGroups.push(g);
                                mergedMatrix[g.id] = [evCode];
                            }
                        });

                        // [중요] 연령대가 추가되었으므로 전체 순서와 범위를 다시 계산
                        if (existing.mode === 'normal') {
                            // 1. 소팅
                            mergedGroups.sort((a, b) => a.sAge - b.sAge);
                            // 2. 범위 재계산
                            mergedGroups = mergedGroups.map((group, idx) => {
                                const nextG = mergedGroups[idx + 1];
                                const dynamicEndAgeParam = nextG ? nextG.sAge - 1 : 999;
                                const finalEndAge = getCalculatedEndAge(group.sAge, dynamicEndAgeParam, 'normal');
                                return { 
                                    ...group, 
                                    startAge: group.sAge, 
                                    endAge: finalEndAge, 
                                    birthRange: getBirthRange(group.sAge, finalEndAge, prev.baseYear) 
                                };
                            });
                        }

                        nextSegments[existingIdx] = { 
                            ...existing, 
                            ageGroups: mergedGroups, 
                            categoryMatrix: mergedMatrix 
                        };
                    } else {
                        // 신규 세그먼트 생성
                        const segmentMapping: Record<string, string[]> = {};
                        finalGroups.forEach(g => { segmentMapping[g.id] = [evCode]; });
                        nextSegments.push({
                            id: `seg-${evCode}-${lvCode}-${crypto.randomUUID()}`,
                            mode: ageMode as any,
                            events: [evCode],
                            levels: [lvCode],
                            ageGroups: finalGroups,
                            categoryMatrix: segmentMapping
                        });
                    }
                });
            });

            return { 
                ...prev, 
                confirmedSegments: nextSegments, 
                selectedEvents: [], 
                selectedLevels: [], 
                ageGroups: [], 
                categoryMatrix: {} 
            };
        });

        setIsMatrixConfirmed(false);
    };

    const handleResetEvent = (segmentId: string, eventCode: string) => {
        setFormData(prev => {
            const nextSegments = (prev.confirmedSegments || []).map(seg => {
                if (seg.id !== segmentId) return seg;
                const nextEvents = seg.events.filter(e => e !== eventCode);
                const nextMapping = { ...seg.categoryMatrix };
                Object.keys(nextMapping).forEach(agId => { nextMapping[agId] = nextMapping[agId].filter(c => c !== eventCode); });
                return { ...seg, events: nextEvents, categoryMatrix: nextMapping };
            }).filter(seg => seg.events.length > 0);
            return { ...prev, confirmedSegments: nextSegments };
        });
    };

    const handleRemoveAgeGroupFromSegment = (segmentId: string, ageGroupId: string) => {
        setFormData(prev => {
            const nextSegments = (prev.confirmedSegments || []).map(seg => {
                if (seg.id !== segmentId) return seg;
                const remainingGroups = seg.ageGroups.filter(g => g.id !== ageGroupId);
                let processedGroups: AgeGroup[] = [];
                if (remainingGroups.length > 0) {
                    if (seg.mode === 'normal') {
                        const sorted = [...remainingGroups].sort((a, b) => a.sAge - b.sAge);
                        processedGroups = sorted.map((group, idx) => {
                            const nextGroup = sorted[idx + 1];
                            const dynamicEndAgeParam = sorted[idx + 1] ? sorted[idx + 1].sAge - 1 : 999;
                            const finalEndAge = getCalculatedEndAge(group.sAge, dynamicEndAgeParam, 'normal');
                            return { ...group, startAge: group.sAge, endAge: finalEndAge, birthRange: getBirthRange(group.sAge, finalEndAge, formData.baseYear) };
                        });
                    } else { processedGroups = remainingGroups; }
                }
                return { ...seg, ageGroups: processedGroups };
            });
            return { ...prev, confirmedSegments: nextSegments };
        });
    };

    const toggleAgeGroupInSegment = (segmentId: string, ageOrId: string | number) => {
        setFormData(prev => {
            const nextSegments = (prev.confirmedSegments || []).map(seg => {
                if (seg.id !== segmentId) return seg;
                const lv = (seg.levels || [])[0];
                const isNormal = seg.mode === 'normal';
                if (isNormal && (lv === "자강" || lv === "준자강") && typeof ageOrId === 'number' && ageOrId !== 20) return seg;
                let nextGroups = [...seg.ageGroups];
                const existingIdx = typeof ageOrId === 'number' ? nextGroups.findIndex(g => g.sAge === ageOrId && g.eAge === ageOrId) : nextGroups.findIndex(g => g.id === ageOrId);
                if (existingIdx !== -1) {
                    const removedGroupId = nextGroups[existingIdx].id;
                    nextGroups.splice(existingIdx, 1);
                    const newMatrix = { ...seg.categoryMatrix };
                    delete newMatrix[removedGroupId];
                    seg.categoryMatrix = newMatrix;
                } else if (typeof ageOrId === 'number' && isNormal) {
                    const id = `ag-${ageOrId}-${ageOrId}-${crypto.randomUUID()}`;
                    const newGroup: AgeGroup = { id, alias: `${ageOrId}`, startAge: ageOrId, endAge: ageOrId, birthRange: getBirthRange(ageOrId, ageOrId, formData.baseYear), sAge: ageOrId, eAge: ageOrId };
                    nextGroups.push(newGroup);
                    nextGroups.sort((a, b) => a.sAge - b.sAge);
                    const newMatrix = { ...seg.categoryMatrix };
                    newMatrix[id] = [...seg.events];
                    seg.categoryMatrix = newMatrix;
                } else if (typeof ageOrId === 'string' && !isNormal) {
                    const masterGroup = (prev.modeSettings?.[seg.mode as keyof typeof prev.modeSettings] || []).find(g => g.id === ageOrId);
                    if (masterGroup) {
                        nextGroups.push(masterGroup);
                        nextGroups.sort((a, b) => (a.sAge || 0) - (b.sAge || 0));
                        const newMatrix = { ...seg.categoryMatrix };
                        newMatrix[masterGroup.id] = [...seg.events];
                        seg.categoryMatrix = newMatrix;
                    }
                }
                if (isNormal) {
                    nextGroups = nextGroups.map((group, idx) => {
                        const nextG = nextGroups[idx + 1];
                        const dynamicEndAgeParam = nextG ? nextG.sAge - 1 : 999;
                        const finalEndAge = getCalculatedEndAge(group.sAge, dynamicEndAgeParam, 'normal');
                        return { ...group, endAge: finalEndAge, birthRange: getBirthRange(group.sAge, finalEndAge, formData.baseYear) };
                    });
                }
                return { ...seg, ageGroups: nextGroups };
            });
            return { ...prev, confirmedSegments: nextSegments };
        });
    };

    const handleResetAllSegmentsForEvent = (eventCode: string, levelCodes?: string[]) => {
        const confirmMsg = levelCodes ? `${eventCode} 종목의 해당 급수 설정을 리셋하시겠습니까?` : `${eventCode} 종목의 모든 설정을 리셋하시겠습니까?`;
        if (!window.confirm(confirmMsg)) return;
        setFormData(prev => ({ ...prev, confirmedSegments: prev.confirmedSegments.filter(s => {
            const isMatchEvent = (s.events || []).includes(eventCode);
            if (!isMatchEvent) return true;
            if (!levelCodes) return false;
            return !(s.levels || []).some(l => levelCodes.includes(l));
        })}));
    };

    return {
        formData, setFormData,
        ageMode, setAgeMode,
        aliasInput, setAliasInput,
        customStartAge, setCustomStartAge,
        customEndAge, setCustomEndAge,
        customStartYear, setCustomStartYear,
        customEndYear, setCustomEndYear,
        isMatrixConfirmed, setIsMatrixConfirmed,
        editingEvent, setEditingEvent,
        toggleEvent, toggleLevel, recalculateAgeGroups, addAgeGroup, 
        toggleAgeConfigGroup, toggleEventInMatrix, handleSaveSegment, 
        handleResetEvent, handleRemoveAgeGroupFromSegment, toggleAgeGroupInSegment, 
        handleResetAllSegmentsForEvent
    };
};
