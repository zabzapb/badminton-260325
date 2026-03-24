import React from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { AppHeader } from "@/components/ui/AppHeader";

export default function DashboardEditPage() {
    const params = useParams();
    const navigate = useNavigate();
    const id = params.id as string;

    return (
        <div className="app-page">
            <AppHeader />
            <div className="app-body" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>대시보드 편집 (ID: {id})</h2>
                <div style={{ padding: '40px', textAlign: 'center', background: '#f5f5f5', borderRadius: '20px', marginTop: '20px' }}>
                    <p>이 경로는 /dashboard/edit/[id] 입니다.</p>
                    <button 
                        onClick={() => navigate("/dashboard")}
                        style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '12px', background: '#000', color: '#fff', border: 'none' }}
                    >
                        대시보드로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
}
