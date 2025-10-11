"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSubscriber = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const database_1 = require("../utils/database");
const logger_1 = require("../middlewares/logger");
class EventSubscriber {
    constructor() {
        this.isListening = false;
        this.processedEvents = new Set(); // For deduplication
        this.maxProcessedEvents = 10000; // Prevent memory leak
        const redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
            connectTimeout: 10000,
        };
        this.redis = new ioredis_1.default(redisConfig);
        this.subscriber = this.redis.duplicate();
        this.setupRedisErrorHandling();
    }
    setupRedisErrorHandling() {
        this.redis.on('error', (err) => {
            logger_1.logger.error('Redis connection error in EventSubscriber:', err);
        });
        this.redis.on('connect', () => {
            logger_1.logger.info('✅ EventSubscriber connected to Redis');
        });
        this.subscriber.on('error', (err) => {
            logger_1.logger.error('Redis subscriber error:', err);
        });
        this.subscriber.on('connect', () => {
            logger_1.logger.info('✅ Redis subscriber connected');
        });
        this.subscriber.on('subscribe', (channel, count) => {
            logger_1.logger.info(`🎧 Subscribed to ${channel}. Total subscriptions: ${count}`);
        });
    }
    async startListening() {
        if (this.isListening) {
            logger_1.logger.warn('⚠️ Event subscriber is already listening');
            return;
        }
        try {
            logger_1.logger.info('🎧 Starting event subscriber for credential events...');
            // Set up message handler
            this.subscriber.on('message', async (channel, message) => {
                if (channel === 'credential-events') {
                    await this.handleCredentialEvent(message);
                }
            });
            // Subscribe to the credential events channel
            await this.subscriber.subscribe('credential-events');
            this.isListening = true;
            logger_1.logger.info('✅ Event subscriber started successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to start event subscriber:', error);
            throw error;
        }
    }
    async handleCredentialEvent(message) {
        try {
            const event = JSON.parse(message);
            logger_1.logger.info(`📥 Received event: ${event.eventId} (type: ${event.eventType})`);
            // Deduplication check
            if (this.processedEvents.has(event.eventId)) {
                logger_1.logger.info(`⚠️ Event ${event.eventId} already processed - skipping`);
                return;
            }
            if (event.eventType === 'CREDENTIAL_ISSUED') {
                await this.processCredentialIssued(event);
                // Mark as processed
                this.addToProcessedEvents(event.eventId);
                // Track success metrics
                await this.incrementMetric('processed_success');
            }
            else {
                logger_1.logger.warn(`⚠️ Unknown event type: ${event.eventType}`);
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Error handling credential event:', error);
            // Track failure metrics
            await this.incrementMetric('processed_failed');
            // Handle failed event (could add to retry queue)
            await this.handleFailedEvent(message, error);
        }
    }
    async processCredentialIssued(event) {
        try {
            const { credential, correlationId } = event;
            logger_1.logger.info(`🔄 Processing credential ${credential.id} from event ${event.eventId}`);
            // Check if credential already exists (idempotency)
            const existing = await database_1.database.getCredentialById(credential.id);
            if (existing) {
                logger_1.logger.info(`⚠️ Credential ${credential.id} already exists in verification database - skipping`);
                return;
            }
            // Store credential in verification database
            await database_1.database.insertCredential(credential);
            logger_1.logger.info(`✅ Successfully processed credential ${credential.id} from event ${event.eventId}`);
            logger_1.logger.info(`   📄 Holder: ${credential.holderName}`);
            logger_1.logger.info(`   🎓 Type: ${credential.credentialType}`);
            logger_1.logger.info(`   🏢 Issuer: ${credential.issuerName}`);
            logger_1.logger.info(`   🔗 Correlation ID: ${correlationId}`);
            // Track the sync in Redis for monitoring
            await this.trackSyncedCredential(credential, event);
        }
        catch (error) {
            logger_1.logger.error(`❌ Failed to process credential event ${event.eventId}:`, error);
            throw error; // Re-throw to trigger retry mechanism
        }
    }
    async trackSyncedCredential(credential, event) {
        try {
            // Store sync information for monitoring/debugging
            const syncInfo = {
                credentialId: credential.id,
                eventId: event.eventId,
                correlationId: event.correlationId,
                syncedAt: new Date().toISOString(),
                holderName: credential.holderName,
                credentialType: credential.credentialType,
                originalTimestamp: event.timestamp
            };
            // Store in Redis hash for quick lookup
            await this.redis.hset('synced-credentials', credential.id, JSON.stringify(syncInfo));
            // Also add to time-ordered list for chronological tracking
            await this.redis.zadd('sync-timeline', Date.now(), JSON.stringify(syncInfo));
            // Keep only last 1000 sync records to prevent memory issues
            await this.redis.zremrangebyrank('sync-timeline', 0, -1001);
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to track synced credential:', error);
            // Don't fail the main process if tracking fails
        }
    }
    addToProcessedEvents(eventId) {
        this.processedEvents.add(eventId);
        // Prevent memory leak by limiting size
        if (this.processedEvents.size > this.maxProcessedEvents) {
            // Remove oldest half when limit reached
            const eventsArray = Array.from(this.processedEvents);
            const toRemove = eventsArray.slice(0, Math.floor(eventsArray.length / 2));
            toRemove.forEach(id => this.processedEvents.delete(id));
            logger_1.logger.info(`🧹 Cleaned up processed events cache (removed ${toRemove.length} entries)`);
        }
    }
    async handleFailedEvent(message, error) {
        try {
            // Store failed event for later analysis/reprocessing
            const failedEventInfo = {
                message,
                error: {
                    name: error.name,
                    message: error instanceof Error ? error.message : String(error),
                    stack: error.stack
                },
                timestamp: new Date().toISOString(),
                retryAt: new Date(Date.now() + 30000).toISOString() // Retry in 30 seconds
            };
            // Add to failed events queue
            await this.redis.lpush('verification-failed-events', JSON.stringify(failedEventInfo));
            // Limit failed events queue size
            await this.redis.ltrim('verification-failed-events', 0, 999); // Keep last 1000
            logger_1.logger.warn('📝 Added failed event to verification failed queue');
        }
        catch (retryError) {
            logger_1.logger.error('❌ Critical: Failed to handle failed event:', retryError);
        }
    }
    async incrementMetric(metric) {
        try {
            await this.redis.incr(`metrics:verification:${metric}`);
            // Also track by day
            const today = new Date().toISOString().split('T')[0];
            await this.redis.incr(`metrics:verification:${metric}:${today}`);
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to update verification metrics:', error);
        }
    }
    async getMetrics() {
        try {
            const [processedSuccess, processedFailed, failedQueueSize] = await Promise.all([
                this.redis.get('metrics:verification:processed_success'),
                this.redis.get('metrics:verification:processed_failed'),
                this.redis.llen('verification-failed-events')
            ]);
            return {
                processedSuccess: parseInt(processedSuccess || '0'),
                processedFailed: parseInt(processedFailed || '0'),
                failedQueueSize,
                isListening: this.isListening,
                processedEventsInMemory: this.processedEvents.size
            };
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to get verification metrics:', error);
            return {
                processedSuccess: 0,
                processedFailed: 0,
                failedQueueSize: 0,
                isListening: this.isListening,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async getSyncedCredentials(limit = 10) {
        try {
            // Get most recent synced credentials
            const results = await this.redis.zrevrange('sync-timeline', 0, limit - 1);
            return results.map(result => {
                try {
                    return JSON.parse(result);
                }
                catch (parseError) {
                    logger_1.logger.error('❌ Failed to parse sync timeline entry:', parseError);
                    return null;
                }
            }).filter(item => item !== null);
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to get synced credentials:', error);
            return [];
        }
    }
    async reprocessFailedEvents() {
        try {
            const failedEvents = await this.redis.lrange('verification-failed-events', 0, -1);
            let reprocessedCount = 0;
            for (const failedEventStr of failedEvents) {
                try {
                    const failedEvent = JSON.parse(failedEventStr);
                    // Retry processing the original message
                    await this.handleCredentialEvent(failedEvent.message);
                    reprocessedCount++;
                }
                catch (error) {
                    logger_1.logger.error('❌ Failed to reprocess verification event:', error);
                }
            }
            if (reprocessedCount > 0) {
                // Clear the failed events queue
                await this.redis.del('verification-failed-events');
                logger_1.logger.info(`✅ Reprocessed ${reprocessedCount} failed verification events`);
            }
            return reprocessedCount;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to reprocess failed verification events:', error);
            return 0;
        }
    }
    async stopListening() {
        if (!this.isListening) {
            return;
        }
        try {
            await this.subscriber.unsubscribe('credential-events');
            this.isListening = false;
            logger_1.logger.info('🔇 Stopped listening to credential events');
        }
        catch (error) {
            logger_1.logger.error('❌ Error stopping event subscriber:', error);
        }
    }
    async shutdown() {
        logger_1.logger.info('🔌 Shutting down EventSubscriber...');
        await this.stopListening();
        await this.redis.quit();
        await this.subscriber.quit();
        logger_1.logger.info('✅ EventSubscriber shut down complete');
    }
}
exports.EventSubscriber = EventSubscriber;
//# sourceMappingURL=eventSubscriber.js.map