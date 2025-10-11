import Redis from 'ioredis';
import { logger } from '../middlewares/logger';

interface CredentialIssuedEvent {
  eventType: 'CREDENTIAL_ISSUED';
  eventId: string;
  timestamp: string;
  credential: any;
  retryCount: number;
  maxRetries: number;
  correlationId: string;
}

interface EventMetrics {
  published: number;
  failed: number;
  retried: number;
  deadLettered: number;
}

export class EventService {
  private redis: Redis;
  private publisher: Redis;
  private retryProcessor: NodeJS.Timeout | null = null;

  constructor() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000
    };

    this.redis = new Redis(redisConfig);
    this.publisher = this.redis.duplicate();

    this.setupRedisErrorHandling();
    this.startRetryProcessor();
  }

  private setupRedisErrorHandling(): void {
    this.redis.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      logger.info('✅ Connected to Redis');
    });

    this.publisher.on('error', (err) => {
      logger.error('Redis publisher error:', err);
    });
  }

  async publishCredentialIssued(credential: any): Promise<void> {
    const event: CredentialIssuedEvent = {
      eventType: 'CREDENTIAL_ISSUED',
      eventId: `evt_${credential.id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      credential,
      retryCount: 0,
      maxRetries: 5,
      correlationId: `corr_${credential.id}_${Date.now()}`
    };

    try {
      logger.info(`📤 Publishing credential issued event: ${event.eventId}`);

      // Primary publish attempt
      await this.publisher.publish('credential-events', JSON.stringify(event));

      // Track metrics
      await this.incrementMetric('published');

      logger.info(`✅ Published event ${event.eventId} successfully`);

    } catch (error) {
      logger.error(`❌ Failed to publish event ${event.eventId}:`, error);

      // Fallback: Add to retry queue immediately
      await this.addToRetryQueue(event);
      await this.incrementMetric('failed');
    }
  }

  private async addToRetryQueue(event: CredentialIssuedEvent, customDelay?: number): Promise<void> {
    try {
      const retryCount = event.retryCount || 0;

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, max 60s
      const delay = customDelay || Math.min(1000 * Math.pow(2, retryCount), 60000);

      const retryEvent: CredentialIssuedEvent = {
        ...event,
        retryCount: retryCount + 1,
        timestamp: new Date().toISOString() // Update timestamp for retry
      };

      // Add to Redis sorted set with score as future timestamp for delayed processing
      const score = Date.now() + delay;
      await this.redis.zadd('credential-retry-queue', score, JSON.stringify(retryEvent));

      logger.info(`🔄 Added event ${event.eventId} to retry queue (attempt ${retryEvent.retryCount}, delay: ${delay}ms)`);

    } catch (error) {
      logger.error('❌ Critical: Failed to add to retry queue:', error);
      // This is critical - could implement fallback file storage here
    }
  }

  private startRetryProcessor(): void {
    // Process retry queue every 5 seconds
    this.retryProcessor = setInterval(async () => {
      try {
        await this.processRetryQueue();
      } catch (error) {
        logger.error('❌ Error in retry processor:', error);
      }
    }, 5000);

    logger.info('🔄 Started retry processor');
  }

  private async processRetryQueue(): Promise<void> {
    const now = Date.now();

    // Get events ready for retry (score <= now)
    const results = await this.redis.zrangebyscore(
      'credential-retry-queue', 
      0, 
      now, 
      'LIMIT', 
      0, 
      10  // Process max 10 at a time
    );

    for (const result of results) {
      try {
        const event: CredentialIssuedEvent = JSON.parse(result);

        if (event.retryCount >= event.maxRetries) {
          // Max retries reached - move to dead letter queue
          await this.moveToDeadLetterQueue(event);
          logger.warn(`💀 Event ${event.eventId} moved to dead letter queue after ${event.retryCount} retries`);
        } else {
          // Retry publishing
          logger.info(`🔄 Retrying event ${event.eventId} (attempt ${event.retryCount})`);

          try {
            await this.publisher.publish('credential-events', JSON.stringify(event));
            logger.info(`✅ Successfully retried event ${event.eventId}`);
            await this.incrementMetric('retried');
          } catch (publishError) {
            logger.error(`❌ Retry failed for event ${event.eventId}:`, publishError);
            // Add back to retry queue with incremented count
            await this.addToRetryQueue(event);
            continue; // Don't remove from queue yet
          }
        }

        // Remove from retry queue (successful or dead-lettered)
        await this.redis.zrem('credential-retry-queue', result);

      } catch (parseError) {
        logger.error('❌ Failed to parse retry event:', parseError);
        // Remove corrupted event from queue
        await this.redis.zrem('credential-retry-queue', result);
      }
    }
  }

  private async moveToDeadLetterQueue(event: CredentialIssuedEvent): Promise<void> {
    try {
      const deadLetterEvent = {
        ...event,
        deadLetteredAt: new Date().toISOString(),
        reason: 'MAX_RETRIES_EXCEEDED'
      };

      await this.redis.lpush('credential-dead-letter', JSON.stringify(deadLetterEvent));
      await this.incrementMetric('deadLettered');

      // Also store in a hash for easier retrieval by ID
      await this.redis.hset(
        'dead-letter-index', 
        event.eventId, 
        JSON.stringify(deadLetterEvent)
      );

    } catch (error) {
      logger.error('❌ Failed to move to dead letter queue:', error);
    }
  }

  private async incrementMetric(metric: keyof EventMetrics): Promise<void> {
    try {
      await this.redis.incr(`metrics:events:${metric}`);
      await this.redis.incr(`metrics:events:total`);

      // Also track by day for trending
      const today = new Date().toISOString().split('T')[0];
      await this.redis.incr(`metrics:events:${metric}:${today}`);

    } catch (error) {
      logger.error('❌ Failed to update metrics:', error);
    }
  }

  async getMetrics(): Promise<EventMetrics> {
    try {
      const [published, failed, retried, deadLettered] = await Promise.all([
        this.redis.get('metrics:events:published'),
        this.redis.get('metrics:events:failed'),  
        this.redis.get('metrics:events:retried'),
        this.redis.get('metrics:events:deadLettered')
      ]);

      return {
        published: parseInt(published || '0'),
        failed: parseInt(failed || '0'),
        retried: parseInt(retried || '0'),
        deadLettered: parseInt(deadLettered || '0')
      };
    } catch (error) {
      logger.error('❌ Failed to get metrics:', error);
      return { published: 0, failed: 0, retried: 0, deadLettered: 0 };
    }
  }

  async getQueueStats(): Promise<any> {
    try {
      const [retryQueueSize, deadLetterSize] = await Promise.all([
        this.redis.zcard('credential-retry-queue'),
        this.redis.llen('credential-dead-letter')
      ]);

      return {
        retryQueueSize,
        deadLetterSize,
        status: 'healthy'
      };
    } catch (error) {
      logger.error('❌ Failed to get queue stats:', error);
      return {
        retryQueueSize: -1,
        deadLetterSize: -1,
        status: 'error'
      };
    }
  }

  async reprocessDeadLetterQueue(): Promise<number> {
    try {
      const deadEvents = await this.redis.lrange('credential-dead-letter', 0, -1);
      let reprocessedCount = 0;

      for (const eventStr of deadEvents) {
        try {
          const event = JSON.parse(eventStr);

          // Reset retry count and republish
          const resetEvent: CredentialIssuedEvent = {
            ...event,
            retryCount: 0,
            timestamp: new Date().toISOString()
          };

          await this.publisher.publish('credential-events', JSON.stringify(resetEvent));
          reprocessedCount++;

        } catch (error) {
          logger.error('❌ Failed to reprocess dead letter event:', error);
        }
      }

      if (reprocessedCount > 0) {
        // Clear the dead letter queue
        await this.redis.del('credential-dead-letter');
        await this.redis.del('dead-letter-index');

        logger.info(`✅ Reprocessed ${reprocessedCount} dead letter events`);
      }

      return reprocessedCount;

    } catch (error) {
      logger.error('❌ Failed to reprocess dead letter queue:', error);
      return 0;
    }
  }

  async shutdown(): Promise<void> {
    if (this.retryProcessor) {
      clearInterval(this.retryProcessor);
      this.retryProcessor = null;
    }

    await this.redis.quit();
    await this.publisher.quit();

    logger.info('🔌 Event service shut down gracefully');
  }
}