import React from "react";
import { Icon } from "@/components/ui/Icon";
import { EVENT_LIST } from "@/utils/tournamentUtils";

interface Props {
    selectedEvents: string[];
    toggleEvent: (code: string) => void;
}

export const EventSelection: React.FC<Props> = ({ selectedEvents, toggleEvent }) => {
    return (
        <div className="setup-step">
            <h4 className="input-label">1. 종목 선택 (중복 선택 가능)</h4>
            <div className="event-pool">
                {EVENT_LIST.map(ev => {
                    const isActive = selectedEvents.includes(ev.code);
                    return (
                        <div 
                            key={ev.code} 
                            className={`event-chip ${isActive ? 'active' : ''}`} 
                            onClick={() => toggleEvent(ev.code)}
                        >
                            <Icon 
                                name={ev.icon} 
                                size={16} 
                                color={isActive ? '#FFFFFF' : '#7F7F7F'} 
                            /> 
                            {ev.name}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
