import React, { useState, useEffect } from 'react';
import { getPendingTasks } from '@/core/queue/syncQueue';
import { Icon } from '@/components/ui/Icon';
import './SyncStatusIndicator.css';

/**
 * Sync Status Indicator Component (Admin)
 * Monitors the background sync queue and displays pending tasks with pulse animation.
 */
export const SyncStatusIndicator: React.FC = () => {
    const [taskCount, setTaskCount] = useState(0);

    const refreshCount = async () => {
        const tasks = await getPendingTasks();
        setTaskCount(tasks.length);
    };

    useEffect(() => {
        refreshCount();
        // Periodic check for local queue state
        const interval = setInterval(refreshCount, 5000);
        return () => clearInterval(interval);
    }, []);

    if (taskCount === 0) return null;

    return (
        <div className="sync-monitor" title={`${taskCount}건의 데이터가 동기화 대기 중입니다.`}>
            <div className="sync-monitor__icon-wrapper">
                <Icon name="refresh" size={14} color="#FF9500" className="sync-monitor__icon" />
                <span className="sync-monitor__pulse" />
            </div>
            <span className="sync-monitor__count">{taskCount}</span>
            <span className="sync-monitor__label">SYNC PENDING</span>
        </div>
    );
};
