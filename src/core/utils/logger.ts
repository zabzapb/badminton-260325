/**
 * System Logger
 * Securely traces authentication events for operational traceability.
 */

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | (string & {});

export interface AuthEventPayload {
    event: string;
    userId?: string;
    provider?: string;
    status: string;
    metadata?: any;
    timestamp: string;
}

export const logger = {
    log: (level: LogLevel, payload: any) => {
        // Simplified signature to handle various payload structures
        const eventName = payload.event || 'LOG';
        const message = `[${level}] ${eventName}: ${payload.status || ''} (UID: ${payload.userId || 'Guest'})`;
        
        switch (level) {
            case 'ERROR': console.error(message, payload.metadata); break;
            case 'WARNING': console.warn(message, payload.metadata); break;
            default: console.log(message, payload.metadata);
        }

        // TODO: Send to remote observability endpoint (e.g. Sentry, Datadog or Custom Log Server)
    },

    authSuccess: (userId: string, provider: string) => {
        logger.log('SUCCESS', {
            event: 'AUTH_SUCCESS',
            userId,
            provider,
            status: 'COMPLETED',
            timestamp: new Date().toISOString()
        });
    },

    authFailed: (reason: string, provider: string, metadata?: any) => {
        logger.log('ERROR', {
            event: 'AUTH_FAILED',
            provider,
            status: reason,
            metadata,
            timestamp: new Date().toISOString()
        });
    }
};

export const authLogger = logger;
