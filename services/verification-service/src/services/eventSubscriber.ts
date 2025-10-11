import Redis from 'ioredis';
import { database } from '../utils/database';
import { logger } from '../middlewares/logger';

interface CredentialIssuedEvent {
  eventType: 'CREDENTIAL_ISSUED';
  eventId: string;
  timestamp: string;
  credential: any;
  retryCount: number;
  correlationId: string;
}

export class EventSubscriber {
  private redis: Redis;
  private subscriber: Redis;
  private isListening = false;
  private processedEvents = new Set<string>(); // For deduplication
  private readonly maxProcessedEvents = 10000; // Prevent memory leak

  constructor() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
    };

    this.redis = new Redis(redisConfig);
    this.subscriber = this.redis.duplicate();

    this.setupRedisErrorHandling();
  }

  private setupRedisErrorHandling(): void {
    this.redis.on('error', (err) => {
      logger.error('Redis connection error in EventSubscriber:', err);
    });

    this.redis.on('connect', () => {
      logger.info('✅ EventSubscriber connected to Redis');
    });

    this.subscriber.on('error', (err) => {
      logger.error('Redis subscriber error:', err);
    });

    this.subscriber.on('connect', () => {
      logger.info('✅ Redis subscriber connected');
    });

    this.subscriber.on('subscribe', (channel, count) => {
      logger.info(`🎧 Subscribed to ${channel}. Total subscriptions: ${count}`);
    });
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('⚠️ Event subscriber is already listening');
      return;
    }

    try {
      logger.info('🎧 Starting event subscriber for credential events...');

      // Set up message handler
      this.subscriber.on('message', async (channel, message) => {
        if (channel === 'credential-events') {
          await this.handleCredentialEvent(message);
        }
      });

      // Subscribe to the credential events channel
      await this.subscriber.subscribe('credential-events');

      this.isListening = true;
      logger.info('✅ Event subscriber started successfully');

    } catch (error) {
      logger.error('❌ Failed to start event subscriber:', error);
      throw error;
    }
  }

  private async handleCredentialEvent(message: string): Promise<void> {
    try {
      const event: CredentialIssuedEvent = JSON.parse(message);

      logger.info(`📥 Received event: ${event.eventId} (type: ${event.eventType})`);

      // Deduplication check
      if (this.processedEvents.has(event.eventId)) {
        logger.info(`⚠️ Event ${event.eventId} already processed - skipping`);
        return;
      }

      if (event.eventType === 'CREDENTIAL_ISSUED') {
        await this.processCredentialIssued(event);

        // Mark as processed
        this.addToProcessedEvents(event.eventId);

        // Track success metrics
        await this.incrementMetric('processed_success');
      } else {
        logger.warn(`⚠️ Unknown event type: ${event.eventType}`);
      }

    } catch (error) {
      logger.error('❌ Error handling credential event:', error);

      // Track failure metrics
      await this.incrementMetric('processed_failed');

      // Handle failed event (could add to retry queue)
      await this.handleFailedEvent(message, error);
    }
  }

  private async processCredentialIssued(event: CredentialIssuedEvent): Promise<void> {
    try {
      const { credential, correlationId } = event;

      logger.info(`🔄 Processing credential ${credential.id} from event ${event.eventId}`);

      // Check if credential already exists (idempotency)
      const existing = await database.getCredentialById(credential.id);
      if (existing) {
        logger.info(`⚠️ Credential ${credential.id} already exists in verification database - skipping`);
        return;
      }

      // Store credential in verification database
      await database.insertCredential(credential);

      logger.info(`✅ Successfully processed credential ${credential.id} from event ${event.eventId}`);
      logger.info(`   📄 Holder: ${credential.holderName}`);
      logger.info(`   🎓 Type: ${credential.credentialType}`);  
      logger.info(`   🏢 Issuer: ${credential.issuerName}`);
      logger.info(`   🔗 Correlation ID: ${correlationId}`);

      // Track the sync in Redis for monitoring
      await this.trackSyncedCredential(credential, event);

    } catch (error) {
      logger.error(`❌ Failed to process credential event ${event.eventId}:`, error);
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  private async trackSyncedCredential(credential: any, event: CredentialIssuedEvent): Promise<void> {
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
      await this.redis.hset(
        'synced-credentials',
        credential.id,
        JSON.stringify(syncInfo)
      );

      // Also add to time-ordered list for chronological tracking
      await this.redis.zadd(
        'sync-timeline',
        Date.now(),
        JSON.stringify(syncInfo)
      );

      // Keep only last 1000 sync records to prevent memory issues
      await this.redis.zremrangebyrank('sync-timeline', 0, -1001);

    } catch (error) {
      logger.error('❌ Failed to track synced credential:', error);
      // Don't fail the main process if tracking fails
    }
  }

  private addToProcessedEvents(eventId: string): void {
    this.processedEvents.add(eventId);

    // Prevent memory leak by limiting size
    if (this.processedEvents.size > this.maxProcessedEvents) {
      // Remove oldest half when limit reached
      const eventsArray = Array.from(this.processedEvents);
      const toRemove = eventsArray.slice(0, Math.floor(eventsArray.length / 2));

      toRemove.forEach(id => this.processedEvents.delete(id));

      logger.info(`🧹 Cleaned up processed events cache (removed ${toRemove.length} entries)`);
    }
  }

  private async handleFailedEvent(message: string, error: any): Promise<void> {
    try {
      // Store failed event for later analysis/reprocessing
      const failedEventInfo = {
        message,
        error: {
          name: error.name,
          message:  error instanceof Error ? error.message : String(error),
          stack: error.stack
        },
        timestamp: new Date().toISOString(),
        retryAt: new Date(Date.now() + 30000).toISOString() // Retry in 30 seconds
      };

      // Add to failed events queue
      await this.redis.lpush('verification-failed-events', JSON.stringify(failedEventInfo));

      // Limit failed events queue size
      await this.redis.ltrim('verification-failed-events', 0, 999); // Keep last 1000

      logger.warn('📝 Added failed event to verification failed queue');

    } catch (retryError) {
      logger.error('❌ Critical: Failed to handle failed event:', retryError);
    }
  }

  private async incrementMetric(metric: string): Promise<void> {
    try {
      await this.redis.incr(`metrics:verification:${metric}`);

      // Also track by day
      const today = new Date().toISOString().split('T')[0];
      await this.redis.incr(`metrics:verification:${metric}:${today}`);

    } catch (error) {
      logger.error('❌ Failed to update verification metrics:', error);
    }
  }

  async getMetrics(): Promise<any> {
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
    } catch (error) {
      logger.error('❌ Failed to get verification metrics:', error);
      return {
        processedSuccess: 0,
        processedFailed: 0,
        failedQueueSize: 0,
        isListening: this.isListening,
        error:  error instanceof Error ? error.message : String(error)
      };
    }
  }

  async getSyncedCredentials(limit: number = 10): Promise<any[]> {
    try {
      // Get most recent synced credentials
      const results = await this.redis.zrevrange('sync-timeline', 0, limit - 1);

      return results.map(result => {
        try {
          return JSON.parse(result);
        } catch (parseError) {
          logger.error('❌ Failed to parse sync timeline entry:', parseError);
          return null;
        }
      }).filter(item => item !== null);

    } catch (error) {
      logger.error('❌ Failed to get synced credentials:', error);
      return [];
    }
  }

  async reprocessFailedEvents(): Promise<number> {
    try {
      const failedEvents = await this.redis.lrange('verification-failed-events', 0, -1);
      let reprocessedCount = 0;

      for (const failedEventStr of failedEvents) {
        try {
          const failedEvent = JSON.parse(failedEventStr);

          // Retry processing the original message
          await this.handleCredentialEvent(failedEvent.message);
          reprocessedCount++;

        } catch (error) {
          logger.error('❌ Failed to reprocess verification event:', error);
        }
      }

      if (reprocessedCount > 0) {
        // Clear the failed events queue
        await this.redis.del('verification-failed-events');
        logger.info(`✅ Reprocessed ${reprocessedCount} failed verification events`);
      }

      return reprocessedCount;

    } catch (error) {
      logger.error('❌ Failed to reprocess failed verification events:', error);
      return 0;
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      await this.subscriber.unsubscribe('credential-events');
      this.isListening = false;
      logger.info('🔇 Stopped listening to credential events');
    } catch (error) {
      logger.error('❌ Error stopping event subscriber:', error);
    }
  }

  async shutdown(): Promise<void> {
    logger.info('🔌 Shutting down EventSubscriber...');

    await this.stopListening();
    await this.redis.quit();
    await this.subscriber.quit();

    logger.info('✅ EventSubscriber shut down complete');
  }
}