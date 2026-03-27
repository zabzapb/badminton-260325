import React from "react";
import { LEVEL_LIST } from "@/utils/tournamentUtils";

interface Props {
    selectedLevels: string[];
    toggleLevel: (lv: string) => void;
}

export const LevelSelection: React.FC<Props> = ({ selectedLevels, toggleLevel }) => {
    return (
        <div className="setup-step">
            <h4 className="input-label">2. 급수 선택 (묶음 선택 가능)</h4>
            <div className="age-chip-grid">
                {LEVEL_LIST.filter(lv => lv !== "Elite").map(lv => {
                    const isActive = selectedLevels.includes(lv);
                    return (
                        <button 
                            key={lv} 
                            type="button" 
                            className={`age-option-chip ${isActive ? 'is-selected' : ''}`} 
                            onClick={() => toggleLevel(lv)}
                        >
                            {lv}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
