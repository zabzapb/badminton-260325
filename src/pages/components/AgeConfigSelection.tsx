import React from "react";
import { Icon } from "@/components/ui/Icon";
import { AGE_OPTIONS } from "@/utils/tournamentUtils";
import { useTournamentForm } from "@/hooks/useTournamentForm";

interface Props {
    formHook: ReturnType<typeof useTournamentForm>;
    hasLevels: boolean;
    hasEvents: boolean;
}

export const AgeConfigSelection: React.FC<Props> = ({ formHook, hasLevels, hasEvents }) => {
    const {
        formData, setFormData, ageMode, setAgeMode, aliasInput, setAliasInput,
        customStartAge, setCustomStartAge, customEndAge, setCustomEndAge,
        customStartYear, setCustomStartYear, customEndYear, setCustomEndYear,
        addAgeGroup, toggleAgeConfigGroup, setIsMatrixConfirmed, handleSaveSegment
    } = formHook;

    const modes = [
        { id: 'normal', label: '일반 모드', desc: '연령대별 기본 구분 (20대, 30대...)', icon: 'person' },
        { id: 'ageInput', label: '합산 모드', desc: '파트너와의 나이 합계 기준 (80+, 100+...)', icon: 'plus' },
        { id: 'yearInput', label: '입력 모드', desc: '직접 연령대 및 조건 입력', icon: 'calendar' }
    ] as const;

    const handleModeClick = (modeId: typeof modes[number]['id']) => {
        if (ageMode === modeId) {
            setAgeMode(null);
        } else {
            setAgeMode(modeId);
            setFormData(prev => ({
                ...prev,
                ageGroups: formData.modeSettings?.[modeId] || []
            }));
        }
        setIsMatrixConfirmed(false);
    };

    const handleRemoveTag = (agId: string, modeId: string) => {
        const next = formData.ageGroups.filter(g => g.id !== agId);
        setFormData(p => ({
            ...p,
            ageGroups: next,
            modeSettings: { ...p.modeSettings, [modeId]: next },
            categoryMatrix: Object.fromEntries(
                Object.entries(p.categoryMatrix).filter(([k]) => k !== agId)
            )
        }));
    };

    return (
        <div className={`age-config-selection-wrapper setup-step ${!(hasLevels && hasEvents) ? 'disabled' : ''}`}>
            <h4 className="input-label">3. 연령대 설정</h4>
            
            {!(hasLevels && hasEvents) && (
                <div className="placeholder-box">
                    먼저 위에서 설정할 종목과 급수를 선택해주세요.
                </div>
            )}

            <div className="age-config-box no-border">
                <div className="age-mode-list">
                    {modes.map(mode => {
                        const isActive = ageMode === mode.id;
                        return (
                            <div key={mode.id} className="age-mode-container">
                                <div 
                                    className={`age-mode-card ${isActive ? 'active' : ''}`} 
                                    onClick={() => handleModeClick(mode.id)}
                                >
                                    <div className="age-mode-icon-box">
                                        <Icon name={mode.icon as any} size={24} color={isActive ? '#fff' : '#FF6B3D'} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="mode-label">{mode.label}</div>
                                        <div className="mode-desc">{mode.desc}</div>
                                    </div>
                                    {isActive && <Icon name="check" size={20} color="#fff" />}
                                </div>

                                {isActive && (
                                    <div className="age-mode-details">
                                        {mode.id === 'normal' && (
                                            <div className="age-chip-grid cols-4">
                                                {AGE_OPTIONS.map(a => {
                                                    const isSel = !!formData.ageGroups.find(ag => ag.sAge === a && ag.eAge === a);
                                                    return (
                                                        <button 
                                                            key={a} 
                                                            type="button" 
                                                            className={`age-option-chip ${isSel ? 'is-selected' : ''}`} 
                                                            onClick={() => toggleAgeConfigGroup(a)}
                                                        >
                                                            {a}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {(mode.id === 'ageInput' || mode.id === 'yearInput') && (
                                            <div className="direct-age-input">
                                                <div className="input-group">
                                                    <label className="input-label">연령대 구분명 (필수)</label>
                                                    <input 
                                                        className="input-field" 
                                                        placeholder="예: 80+, 2030 통합 등" 
                                                        value={aliasInput} 
                                                        onChange={e => setAliasInput(e.target.value)} 
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                                                    <div className="input-group">
                                                        <label className="input-label">
                                                            {mode.id === 'ageInput' ? '시작 합산 나이' : '낮은 나이 (생년)'}
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            className="input-field" 
                                                            value={mode.id === 'ageInput' ? customStartAge : customStartYear} 
                                                            onChange={e => mode.id === 'ageInput' ? setCustomStartAge(Number(e.target.value)) : setCustomStartYear(Number(e.target.value))} 
                                                        />
                                                    </div>
                                                    <div className="input-group">
                                                        <label className="input-label">
                                                            {mode.id === 'ageInput' ? '끝 합산 나이' : '높은 나이 (생년)'}
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            className="input-field" 
                                                            value={mode.id === 'ageInput' ? customEndAge : customEndYear} 
                                                            onChange={e => mode.id === 'ageInput' ? setCustomEndAge(Number(e.target.value)) : setCustomEndYear(Number(e.target.value))} 
                                                        />
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        className="btn-add-group" 
                                                        onClick={() => { 
                                                            if (!aliasInput.trim()) return alert("구분명을 입력해주세요."); 
                                                            addAgeGroup(mode.id === 'ageInput' ? customStartAge : customStartYear, mode.id === 'ageInput' ? customEndAge : customEndYear, aliasInput); 
                                                            setAliasInput(""); 
                                                        }}
                                                    >
                                                        + 연령대 추가
                                                    </button>
                                                </div>

                                                {formData.ageGroups.length > 0 && (
                                                    <div className="selected-groups-tags">
                                                        {formData.ageGroups.map(ag => (
                                                            <div key={ag.id} className="group-tag">
                                                                <span className="alias">{ag.alias}</span>
                                                                <span className="range">({ag.birthRange})</span>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn-remove" 
                                                                    onClick={() => handleRemoveTag(ag.id, mode.id)}
                                                                >
                                                                    <Icon name="close" size={14} color="#fff" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button 
                                            type="button" 
                                            className="btn-save-matrix" 
                                            onClick={handleSaveSegment}
                                        >
                                            종목 설정 저장
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
