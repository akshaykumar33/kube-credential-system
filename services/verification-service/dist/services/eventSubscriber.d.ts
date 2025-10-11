export declare class EventSubscriber {
    private redis;
    private subscriber;
    private isListening;
    private processedEvents;
    private readonly maxProcessedEvents;
    constructor();
    private setupRedisErrorHandling;
    startListening(): Promise<void>;
    private handleCredentialEvent;
    private processCredentialIssued;
    private trackSyncedCredential;
    private addToProcessedEvents;
    private handleFailedEvent;
    private incrementMetric;
    getMetrics(): Promise<any>;
    getSyncedCredentials(limit?: number): Promise<any[]>;
    reprocessFailedEvents(): Promise<number>;
    stopListening(): Promise<void>;
    shutdown(): Promise<void>;
}
