import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Icon } from "@/components/ui/Icon";
import { AppHeader } from "@/components/ui/AppHeader";
import { Calendar } from "@/components/ui/Calendar";
import { SegmentedControl } from "@/components/ui/SegmentedControl/SegmentedControl";
import { type ViewState, INITIAL_FORM_DATA } from "@/utils/tournamentUtils";
import { useTournamentForm } from "@/hooks/useTournamentForm";
import { useTournamentData } from "@/hooks/useTournamentData";

import { TournamentListView } from "./components/TournamentListView";
import { ApplicantManagement } from "./components/ApplicantManagement";
import { MatrixSetupSection } from "./components/MatrixSetupSection";
import { MatrixSummary } from "./components/MatrixSummary";
import { TournamentOverviewSection } from "./components/TournamentOverviewSection";

import './RegisterTournamentPage.css';

export default function TournamentRegistrationPage() {
    const navigate = useNavigate();
    const [view, setView] = useState<ViewState>("list");
    const [activeTab, setActiveTab] = useState<string>("overview");
    const [pickingDateType, setPickingDateType] = useState<null | "eventDates" | "deadline">(null);
    
    const formHook = useTournamentForm(); 
    const { formData, setFormData } = formHook;
    const { tournaments, apps, fetchingApps, loadApplications, saveTournamentData } = useTournamentData();

    useEffect(() => {
        if (activeTab === 'applicants' && formData.id) {
            loadApplications(formData.id);
        }
    }, [activeTab, formData.id, loadApplications]);

    const handleSave = async () => {
        if (!formData.name) return alert("대회 이름을 입력해주세요.");
        const result = await saveTournamentData(formData);
        if (result.success) { 
            alert("대회 정보가 저장되었습니다.");
            setView("list"); 
            setFormData(INITIAL_FORM_DATA); 
        }
    };

    const TABS = [
        { id: 'overview', label: '대회 개요' },
        { id: 'setup', label: '급수/연령 설정' },
        { id: 'applicants', label: '신청 현황' }
    ];

    if (view === "list") {
        return (
            <div className="app-page">
                <AppHeader />
                <TournamentListView 
                    tournaments={tournaments} 
                    onAddTournament={() => { 
                        setFormData(INITIAL_FORM_DATA); 
                        setView("form"); 
                        setActiveTab("overview");
                    }} 
                    onEditTournament={(id) => { 
                        const t = tournaments.find(t => t.id === id); 
                        if (t) { 
                            setFormData({...INITIAL_FORM_DATA, ...t}); 
                            setView("form"); 
                            setActiveTab("overview");
                        } 
                    }} 
                />
            </div>
        );
    }

    return (
        <div className="app-page">
            <AppHeader />
            <div className="app-body">
                {/* Hero / Header Section for Form */}
                <div className="profile-management-hero" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <button 
                        type="button" 
                        onClick={() => setView("list")} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <Icon name="arrow-left" size={24} />
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 className="app-body-title" style={{ marginBottom: 0 }}>
                            {formData.id ? "대회 정보 수정" : "신규 대회 등록"}
                        </h2>
                        <span className="app-body-subtitle" style={{ fontSize: '12px', marginTop: '4px' }}>
                            {formData.id ? "Edit Tournament Details" : "Create New Tournament Event"}
                        </span>
                    </div>
                </div>

                {/* Main Tournament Name Input */}
                <div className="input-group" style={{ marginBottom: '32px' }}>
                    <label className="input-label">대회명</label>
                    <input 
                        className="input-field"
                        style={{ fontSize: '20px', fontWeight: 700, border: 'none', borderBottom: '2px solid #000', borderRadius: 0, padding: '0 4px', height: '48px' }}
                        placeholder="대회 이름을 입력하세요"
                        value={formData.name} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    />
                </div>

                {/* Tabs */}
                <div style={{ marginBottom: '32px' }}>
                    <SegmentedControl 
                        tabs={TABS} 
                        activeId={activeTab} 
                        onChange={setActiveTab}
                        fullWidth
                    />
                </div>

                {/* Tab Content */}
                <div className="tab-content-area" style={{ minHeight: '400px' }}>
                    {activeTab === 'overview' && (
                        <TournamentOverviewSection 
                            formData={formData} 
                            setFormData={setFormData} 
                            setPickingDateType={setPickingDateType} 
                            displayEventDates={(() => {
                                const dates = formData.eventDates || [];
                                if (dates.length === 0) return "";
                                if (dates.length === 1) return dates[0].replace(/-/g, ".");
                                const d1 = dates[0].replace(/-/g, ".");
                                const d2 = dates[dates.length - 1].split("-").pop();
                                return `${d1}-${d2}`;
                            })()} 
                            displayDeadline={formData.deadline ? formData.deadline.replace(/-/g, ".") : ""} 
                        />
                    )}
                    
                    {activeTab === 'setup' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <MatrixSetupSection formHook={formHook} />
                            <div style={{ borderTop: '1px solid #eee', paddingTop: '32px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>설정 미리보기 (Matrix)</h3>
                                <MatrixSummary 
                                    formData={formData} 
                                    onResetAllSegments={formHook.handleResetAllSegmentsForEvent} 
                                    onToggleAgeGroup={formHook.toggleAgeGroupInSegment} 
                                />
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'applicants' && (
                        <ApplicantManagement 
                            apps={apps} 
                            fetchingApps={fetchingApps} 
                            onDownloadExcel={() => {
                                alert("엑셀 다운로드 기능은 준비 중입니다.");
                            }} 
                        />
                    )}
                </div>

                {/* Bottom Action Bar */}
                <footer className="form-action-footer" style={{ marginTop: '40px', position: 'sticky', bottom: '20px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', zIndex: 10 }}>
                    <button type="button" className="btn-nav-back" onClick={() => setView("list")} style={{ width: '60px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="close" size={20} color="#000" />
                    </button>
                    <button 
                        type="button" 
                        className="btn-nav-next" 
                        style={{ flex: 1, background: '#FF6B3D', border: 'none' }} 
                        onClick={handleSave}
                    >
                        {formData.id ? "정보 수정 완료" : "대회 등록하기"}
                    </button>
                </footer>
                
                <div style={{ height: '60px' }} />
            </div>

            {/* Calendar Modal */}
            {pickingDateType && (
                <div className="calendar-modal" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setPickingDateType(null)}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
                        <Calendar 
                            selectedDates={pickingDateType === "eventDates" ? (formData.eventDates || []) : [formData.deadline].filter(Boolean)} 
                            onSelect={(d) => { 
                                if (pickingDateType === "eventDates") {
                                    const current = [...(formData.eventDates || [])];
                                    if (current.includes(d)) {
                                        setFormData({ ...formData, eventDates: current.filter(item => item !== d) });
                                    } else if (current.length < 2) {
                                        setFormData({ ...formData, eventDates: [...current, d].sort() });
                                    } else {
                                        // Replace oldest if 2 already? or just toast? 
                                        // Let's just do nothing or replace the last one.
                                        alert("최대 2일까지만 선택 가능합니다.");
                                    }
                                } else {
                                    setFormData({ ...formData, deadline: d }); 
                                    setPickingDateType(null); 
                                }
                            }} 
                        />
                        {pickingDateType === "eventDates" && (
                            <button 
                                onClick={() => setPickingDateType(null)}
                                style={{ 
                                    width: '100%', height: '54px', background: '#FF6B3D', color: '#fff', 
                                    borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '16px' 
                                }}
                            >
                                선택 완료
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

