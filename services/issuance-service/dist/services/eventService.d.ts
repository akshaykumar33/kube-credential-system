interface EventMetrics {
    published: number;
    failed: number;
    retried: number;
    deadLettered: number;
}
export declare class EventService {
    private redis;
    private publisher;
    private retryProcessor;
    constructor();
    private setupRedisErrorHandling;
    publishCredentialIssued(credential: any): Promise<void>;
    private addToRetryQueue;
    private startRetryProcessor;
    private processRetryQueue;
    private moveToDeadLetterQueue;
    private incrementMetric;
    getMetrics(): Promise<EventMetrics>;
    getQueueStats(): Promise<any>;
    reprocessDeadLetterQueue(): Promise<number>;
    shutdown(): Promise<void>;
}
export {};
