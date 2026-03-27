import { Icon } from "@/components/ui/Icon";
import { LEVEL_LIST, AGE_OPTIONS, TournamentFormData } from "@/utils/tournamentUtils";

interface Props {
    formData: TournamentFormData;
    onResetAllSegments: (eventCode: string, levelCodes?: string[]) => void;
    onToggleAgeGroup: (segmentId: string, ageOrId: string | number) => void;
}

export function MatrixSummary({ formData, onResetAllSegments, onToggleAgeGroup }: Props) {
    if ((formData.confirmedSegments || []).length === 0) return null;

    return (
        <div className="confirmed-matrix-view" style={{ marginTop: '40px', background: '#1C1C1E', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {[
                { title: "MD (남복)", eCodes: ["MD"], lvCodes: ["S", "A", "B", "C", "D", "E", "F"] },
                { title: "WD (여복)", eCodes: ["WD"], lvCodes: ["S", "A", "B", "C", "D", "E", "F"] },
                { title: "XD (혼복)", eCodes: ["XD"], lvCodes: ["S", "A", "B", "C", "D", "E", "F"] },
                { title: "MS (남단)", eCodes: ["MS"], lvCodes: ["S", "A", "B", "C", "D", "E", "F"] },
                { title: "WS (여단)", eCodes: ["WS"], lvCodes: ["S", "A", "B", "C", "D", "E", "F"] },
                { title: "MD 자강/준자강", eCodes: ["MD"], lvCodes: ["자강", "준자강"] },
                { title: "WD 자강/준자강", eCodes: ["WD"], lvCodes: ["자강", "준자강"] },
                { title: "XD 준자강", eCodes: ["XD"], lvCodes: ["준자강"] },
                { title: "MS 자강/준자강", eCodes: ["MS"], lvCodes: ["자강", "준자강"] },
                { title: "WS 자강/준자강", eCodes: ["WS"], lvCodes: ["자강", "준자강"] }
            ].map((card) => {
                const segments = (formData.confirmedSegments || []).filter(s => 
                    (s.events || []).some(ev => card.eCodes.includes(ev)) && 
                    (s.levels || []).some(l => card.lvCodes.includes(l))
                );
                if (segments.length === 0) return null;
                const levelsForThisCard = Array.from(new Set(segments.flatMap(s => s.levels || []))).filter(l => card.lvCodes.includes(l)).sort((a, b) => LEVEL_LIST.indexOf(a) - LEVEL_LIST.indexOf(b));
                const cardMode = segments[0]?.mode || 'normal';
                const isNormalMode = cardMode === 'normal';
                const isEliteCard = card.title.includes("자강");
                const tableHeaders = isEliteCard ? [{ label: "20", val: 20, id: "20" }] : (isNormalMode ? AGE_OPTIONS.map(a => ({ label: `${a}`, val: a, id: `${a}` })) : (formData.modeSettings?.[cardMode as keyof typeof formData.modeSettings] || []).map(ag => ({ label: ag.alias, id: ag.id, val: ag.sAge })));
                return (
                    <div key={card.title} style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>{card.title}</h5>
                            <button type="button" onClick={() => onResetAllSegments(card.eCodes[0], card.lvCodes)} style={{ background: 'transparent', border: 'none', color: '#fe7f2d', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 700 }}><Icon name="refresh" size={16} color="#fe7f2d" /> 리셋</button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="matrix-summary-table" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                <thead style={{ color: '#fff' }}><tr><th style={{ width: '60px' }}>급수</th>{tableHeaders.map(h => <th key={h.id}>{h.label}</th>)}</tr></thead>
                                <tbody>
                                    {levelsForThisCard.map(lv => (
                                        <tr key={lv}>
                                            <td style={{ color: '#fff', fontWeight: 700 }}>{lv}</td>
                                            {tableHeaders.map(h => {
                                                const coveringAg = segments.filter(seg => (seg.levels || []).includes(lv)).flatMap(seg => (seg.ageGroups || []).map(ag => ({ ...ag, segmentId: seg.id }))).find(ag => isNormalMode ? (ag.startAge <= (h.val as number) && (ag.endAge === 999 || ag.endAge >= (h.val as number))) : ag.id === h.id);
                                                const isElite = lv === "자강" || lv === "준자강";
                                                const isActive = !!coveringAg;
                                                const isMerged = isNormalMode && coveringAg && (coveringAg.sAge < (h.val as number));
                                                const isDisabled = isElite && isNormalMode && (h.val as number) !== 20;
                                                const targetSegmentId = coveringAg?.segmentId || segments.find(s => (s.levels || []).includes(lv))?.id || "";
                                                return (
                                                    <td key={h.id} style={{ position: 'relative' }}>
                                                        {isMerged && <div style={{ position: 'absolute', left: '-50%', right: '50%', top: '50%', borderTop: '2px dotted rgba(255,255,255,0.2)', height: 0 }} />}
                                                        <button type="button" disabled={isDisabled} onClick={() => !isDisabled && targetSegmentId && onToggleAgeGroup(targetSegmentId, isNormalMode ? (h.val as number) : h.id)} style={{ position: 'relative', zIndex: 1, width: '22px', height: '22px', borderRadius: '50%', background: isMerged ? 'rgba(255,255,255,0.2)' : (isActive ? '#fe7f2d' : (isDisabled ? 'transparent' : 'rgba(255,255,255,0.2)')), border: 'none', cursor: isDisabled ? 'default' : 'pointer', display: (isDisabled && !isActive) ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>{isActive && <Icon name="check" size={12} color="#fff" />}</button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
