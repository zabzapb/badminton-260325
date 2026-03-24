/**
 * Offline-First Sync Queue
 * Manages background retries for failed authentication synchronization requests.
 */

const DB_NAME = 'hctc_sync_db';
const STORE_NAME = 'sync_queue';

export interface SyncTask {
    id: string;
    payload: any;
    status: 'SYNC_PENDING_RETRY' | 'FAILED';
    attempts: number;
    createdAt: string;
}

/**
 * Adds a failed sync task to the persistent queue.
 */
export async function enqueueSyncTask(payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const task: SyncTask = {
                id: `sync_${Date.now()}`,
                payload,
                status: 'SYNC_PENDING_RETRY',
                attempts: 0,
                createdAt: new Date().toISOString()
            };
            tx.objectStore(STORE_NAME).add(task);
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Retrieves all pending sync tasks for background processing.
 */
export async function getPendingTasks(): Promise<SyncTask[]> {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(STORE_NAME, 'readonly');
            const getRequest = tx.objectStore(STORE_NAME).getAll();
            getRequest.onsuccess = () => {
                db.close();
                resolve(getRequest.result || []);
            };
        };
    });
}

/**
 * Clears a successfully processed task from the queue.
 */
export async function resolveSyncTask(id: string): Promise<void> {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => db.close();
    };
}
