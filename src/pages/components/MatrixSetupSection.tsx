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
            {/* Phase 1: Event Selection */}
            <div className="setup-section no-bg">
                <EventSelection 
                    selectedEvents={formData.selectedEvents} 
                    toggleEvent={formHook.toggleEvent} 
                />
            </div>

            {/* Phase 2: Level Selection */}
            <div className="setup-section no-bg">
                <LevelSelection 
                    selectedLevels={formData.selectedLevels} 
                    toggleLevel={formHook.toggleLevel} 
                />
            </div>

            {/* Phase 3: Age Configuration */}
            <AgeConfigSelection 
                formHook={formHook} 
                hasLevels={hasLevels} 
                hasEvents={hasEvents} 
            />
        </div>
    );
}
