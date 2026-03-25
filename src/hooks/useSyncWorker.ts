import { useEffect } from 'react';
import { getPendingTasks, resolveSyncTask } from '@/core/queue/syncQueue';
import { addData } from '@/lib/firebase/firestore';
import { logger } from '@/core/utils/logger';

/**
 * Background Sync Worker Hook
 * Automatically retries failed Firestore writes stored in IndexedDB.
 */
export function useSyncWorker() {
    useEffect(() => {
        const processTasks = async () => {
            const tasks = await getPendingTasks();
            if (tasks.length === 0) return;

            for (const task of tasks) {
                try {
                    // Attempt to push to Firestore
                    const result = await addData('players', task.payload.id, task.payload);
                    if (result.success) {
                        await resolveSyncTask(task.id);
                        logger.log('INFO', { event: 'SYNC_RESOLVED', taskId: task.id, status: 'SUCCESS' });
                    }
                } catch (e) {
                    console.error('Background sync failed for task:', task.id, e);
                }
            }
        };

        // Run once on load and every 30 seconds
        processTasks();
        const interval = setInterval(processTasks, 30000);
        return () => clearInterval(interval);
    }, []);
}
