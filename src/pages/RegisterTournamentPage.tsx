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
    const [isSaving, setIsSaving] = useState(false); // [추가] 저장 중 로딩 상태
    const { tournaments, apps, fetchingApps, loadApplications, saveTournamentData, deleteTournamentData } = useTournamentData();

    useEffect(() => {
        if (formData.id) {
            loadApplications(formData.id);
        }
    }, [formData.id, loadApplications]);

    const handleSave = async () => {
        if (!formData.name) return alert("대회 이름을 입력해주세요.");
        
        setIsSaving(true); // 로딩 시작
        try {
            const result = await saveTournamentData(formData);
            if (result.success) { 
                alert("대회 정보가 저장되었습니다.");
                setView("list"); 
                setFormData(INITIAL_FORM_DATA); 
            } else {
                alert("저장 실패: " + result.error);
            }
        } catch (err) {
            console.error(err);
            alert("알 수 없는 오류가 발생했습니다.");
        } finally {
            setIsSaving(false); // 로딩 종료
        }
    };

    const handleDelete = async () => {
        if (!formData.id) return;
        
        // 삭제 전 최신 신청자 수 다시 확인 (동기화 이슈 방지)
        const { getApplicationsByTournament } = await import("@/lib/firebase/applicationService");
        const latestApps = await getApplicationsByTournament(formData.id);
        
        if (latestApps.length > 0) {
            if (!window.confirm(`[${formData.name}] 참가 신청팀이 ${latestApps.length}팀이 있습니다.\n정말 삭제를 하시겠습니까?\n*삭제 시 신청내역도 함께 삭제가 됩니다.`)) return;
        } else {
            if (!window.confirm("정말 대회를 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다.)")) return;
        }
        
        const res = await deleteTournamentData(formData.id);
        if (res.success) {
            alert("대회가 삭제되었습니다.");
            setView("list");
            setFormData(INITIAL_FORM_DATA);
        } else {
            alert(res.error);
        }
    };

    const TABS = [
        { id: 'overview', label: '대회 개요', icon: 'info' },
        { id: 'setup', label: '종목 설정', icon: 'menu', disabled: !formData.id },
        { id: 'applicants', label: '신청 현황', icon: 'person', disabled: !formData.id }
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
                <div className="profile-management-hero" style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
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
                    <div className="inline-item" style={{ height: '48px' }}>
                        <Icon name="trophy" size={18} color="#C7C7CC" />
                        <input 
                            className="input-field"
                            placeholder="대회 이름을 입력하세요"
                            value={formData.name} 
                            onChange={e => setFormData({ ...formData, name: e.target.value })} 
                            style={{ border: 'none', padding: 0 }}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ marginBottom: '32px' }}>
                    <SegmentedControl 
                        tabs={TABS} 
                        activeId={activeTab} 
                        onChange={setActiveTab}
                        filled
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
                                <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Tournament Matrix Summary</label>
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
                            tournament={formData}
                            fetchingApps={fetchingApps} 
                            onDownloadExcel={() => {
                                alert("엑셀 다운로드 기능은 준비 중입니다.");
                            }} 
                            onRefresh={() => formData.id && loadApplications(formData.id)}
                        />
                    )}
                </div>

                {/* Bottom Action Bar */}
                <footer className="form-action-footer" style={{ marginTop: '40px', gap: '12px' }}>
                    <button type="button" className="btn-nav-back" onClick={() => setView("list")} style={{ width: '60px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="close" size={20} color="#000" />
                    </button>
                    <button 
                        type="button" 
                        className="btn-nav-next" 
                        style={{ flex: 1, background: '#FF6B3D', border: 'none', opacity: isSaving ? 0.7 : 1 }} 
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "처리 중..." : (formData.id ? (activeTab === 'setup' ? "대회 종목 설정 저장" : "대회 정보 저장") : "신규 대회 등록")}
                    </button>
                    {formData.id && (
                        <button 
                            type="button" 
                            style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#F2F2F7', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={handleDelete}
                        >
                            <Icon name="trash" size={20} color="#FF3B30" />
                        </button>
                    )}
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
                                        const newDates = [...current, d].sort();
                                        // Validation: Tournament starts AFTER deadline
                                        if (formData.deadline && newDates[0] <= formData.deadline) {
                                            alert("대회일은 마감일(또는 그 이전)로 설정할 수 없습니다. \n마감일을 먼저 수정해주세요.");
                                            return;
                                        }
                                        setFormData({ ...formData, eventDates: newDates });
                                    } else {
                                        alert("최대 2일까지만 선택 가능합니다.");
                                    }
                                } else {
                                    // Validation: Deadline must be BEFORE the first tournament date
                                    const firstEventDate = formData.eventDates?.[0];
                                    if (firstEventDate && d >= firstEventDate) {
                                        alert("접수 마감일은 대회 시작일보다 빨라야 합니다. \n(대회일: " + firstEventDate.replace(/-/g, ".") + ")");
                                        return;
                                    }
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

