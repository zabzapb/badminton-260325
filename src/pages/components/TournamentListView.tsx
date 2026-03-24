import { TournamentManageCard } from "@/components/ui/TournamentStatusCard";

interface Props {
    tournaments: any[];
    onAddTournament: () => void;
    onEditTournament: (id: string) => void;
}

export function TournamentListView({ tournaments, onAddTournament, onEditTournament }: Props) {
    return (
        <div className="app-body">
            <div className="app-page-title-group" style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 className="app-body-title" style={{ margin: 0 }}>배드민턴 대회 관리</h2>
                <span className="app-body-subtitle" style={{ margin: 0, fontSize: '12px' }}>Badminton Tournament Management</span>
            </div>
            <button className="btn-add-tournament" onClick={onAddTournament}>
                <span>신규 대회 등록</span>
            </button>
            <div className="tournament-manage-list">
                {[...tournaments].sort((a,b) => (a.deadline || "9999-99-99").localeCompare(b.deadline || "9999-99-99")).map((t: any) => {
                    let displayDate = t.eventDate || "";
                    if (t.eventDates && t.eventDates.length > 0) {
                        if (t.eventDates.length === 1) displayDate = t.eventDates[0].replace(/-/g, ".");
                        else if (t.eventDates.length >= 2) {
                            const start = t.eventDates[0].replace(/-/g, ".");
                            const end = t.eventDates[1].split("-").pop();
                            displayDate = `${start} - ${end}`;
                        }
                    }
                    return (
                        <TournamentManageCard 
                            key={t.id} 
                            {...t} 
                            eventDate={displayDate} 
                            className="card-bw" 
                            onClick={() => onEditTournament(t.id)} 
                        />
                    );
                })}
            </div>
        </div>
    );
}
