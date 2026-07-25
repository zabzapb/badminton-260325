import { TournamentManageCard } from "@/components/ui/TournamentStatusCard";

interface Props {
    tournaments: any[];
    onAddTournament: () => void;
    onEditTournament: (id: string) => void;
}

export function TournamentListView({ tournaments, onAddTournament, onEditTournament }: Props) {
    const now = new Date();

    const getGroup = (t: any) => {
        const lastDateStr = t.eventDates?.length > 0 ? t.eventDates[t.eventDates.length - 1] : t.eventDate;
        const tEndDate = lastDateStr ? new Date(lastDateStr + "T23:59:59") : null;
        const isFinished = (tEndDate && now > tEndDate) || t.status === "finished";
        return isFinished ? 2 : 1; // 1: 예정/진행 중인 대회, 2: 지난 대회
    };

    const sortedTournaments = [...tournaments].sort((a, b) => {
        const gA = getGroup(a);
        const gB = getGroup(b);

        if (gA !== gB) {
            return gA - gB; // 예정(1)이 상단, 지난 대회(2)가 하단
        }

        const dateA = a.eventDates?.[0] || a.eventDate || "9999-99-99";
        const dateB = b.eventDates?.[0] || b.eventDate || "9999-99-99";

        if (gA === 1) {
            // 예정된 대회: 가장 가까운 미래 날짜 순 (오름차순)
            return dateA.localeCompare(dateB);
        } else {
            // 지난 대회: 오늘과 가장 가까운 날짜 순 (최근 종료일 우선: 내림차순)
            return dateB.localeCompare(dateA);
        }
    });

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
                {sortedTournaments.map((t: any) => {
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
