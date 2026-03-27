import React from "react";
import { useTournamentForm } from "@/hooks/useTournamentForm";
import { EventSelection } from "./EventSelection";
import { LevelSelection } from "./LevelSelection";
import { AgeConfigSelection } from "./AgeConfigSelection";
import "./tournament-setup.css";

interface Props {
    formHook: ReturnType<typeof useTournamentForm>;
}

export function MatrixSetupSection({ formHook }: Props) {
    const { formData } = formHook;

    const hasLevels = (formData.selectedLevels || []).length > 0;
    const hasEvents = (formData.selectedEvents || []).length > 0;

    return (
        <div className="setup-wrapper">
            <label className="input-label" style={{ display: 'block', marginBottom: '4px' }}>Event Category</label>
            <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: '1.6', marginBottom: '20px', paddingLeft: '4px' }}>
                하위 종목(급수, 연령)이 동일할 경우 묶음 선택을 하면 일괄 적용이 됩니다.<br />
                하위 종목이 다른 경우에는 각각 설정을 합니다.<br />
                <span style={{ fontSize: '12px', opacity: 0.8 }}>예) 혼복에서 2030 통합일 경우 혼복은 단독 설정</span>
            </p>
            <div className="setup-card">
                {/* Phase 1: Event Selection */}
                <EventSelection 
                    selectedEvents={formData.selectedEvents} 
                    toggleEvent={formHook.toggleEvent} 
                />

                {/* Phase 2: Level Selection */}
                <LevelSelection 
                    selectedLevels={formData.selectedLevels} 
                    toggleLevel={formHook.toggleLevel} 
                />

                {/* Phase 3: Age Configuration */}
                <AgeConfigSelection 
                    formHook={formHook} 
                    hasLevels={hasLevels} 
                    hasEvents={hasEvents} 
                />
            </div>
        </div>
    );
}
