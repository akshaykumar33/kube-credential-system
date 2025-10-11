import { v4 as uuidv4 } from 'uuid';
import { database } from '../utils/database';
import { CredentialRequest, IssuedCredential, IssuanceResponse } from '../models/credential';
import { EventService } from './eventService';
import { logger } from '../middlewares/logger';
import os from 'os';

export class IssuanceService {
  private workerId: string;
  private eventService: EventService;

  constructor() {
    this.workerId = process.env.POD_NAME?`worker-${process.env.POD_NAME}`:`${os.hostname()}-${process.pid}`;
    this.eventService = new EventService();

    logger.info(`🚀 Initialized IssuanceService with workerId: ${this.workerId}`);
  }

  async issueCredential(credentialRequest: CredentialRequest): Promise<IssuanceResponse> {
    try {
      logger.info(`📋 Processing credential request for: ${credentialRequest.holderName}`);

      // 1. Check if credential already exists
      const exists = await database.checkIfCredentialExists(
        credentialRequest.holderName,
        credentialRequest.credentialType,
        credentialRequest.issuerName
      );

      if (exists) {
        logger.warn(`⚠️ Credential already exists for ${credentialRequest.holderName}`);
        return {
          success: false,
          message: `Credential already exists for ${credentialRequest.holderName} of type ${credentialRequest.credentialType}`,
          workerId: this.workerId
        };
      }

      // 2. Create the credential
      const credentialId = uuidv4();
      const timestamp = new Date().toISOString();
      const issueDate = new Date().toISOString().split('T')[0];

      const issuedCredential: IssuedCredential = {
        id: credentialId,
        holderName: credentialRequest.holderName,
        credentialType: credentialRequest.credentialType,
        issueDate,
        expiryDate: credentialRequest.expiryDate,
        issuerName: credentialRequest.issuerName,
        metadata: credentialRequest.metadata,
        workerId: this.workerId,
        timestamp,
        issuedBy: `worker-${this.workerId}`
      };

      // 3. Store in local database first (source of truth)
      await database.insertCredential(issuedCredential);
      logger.info(`✅ Stored credential ${credentialId} in local database`);

      // 4. 🚀 Publish event to Redis pub/sub for real-time sync
      await this.eventService.publishCredentialIssued(issuedCredential);

      logger.info(`🎉 Successfully issued credential ${credentialId} for ${credentialRequest.holderName}`);

      return {
        success: true,
        message: `Credential issued and published by worker-${this.workerId}`,
        credential: issuedCredential,
        workerId: this.workerId
      };

    } catch (error) {
      logger.error('❌ Error issuing credential:', error);
      throw new Error(`Failed to issue credential: ${ error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getMetrics(): Promise<any> {
    try {
      const eventMetrics = await this.eventService.getMetrics();
      const queueStats = await this.eventService.getQueueStats();

      return {
        workerId: this.workerId,
        events: eventMetrics,
        queues: queueStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Error getting metrics:', error);
      return {
        workerId: this.workerId,
        error:  error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  async reprocessFailedEvents(): Promise<number> {
    try {
      logger.info('🔄 Reprocessing failed events from dead letter queue...');
      const reprocessedCount = await this.eventService.reprocessDeadLetterQueue();
      logger.info(`✅ Reprocessed ${reprocessedCount} failed events`);
      return reprocessedCount;
    } catch (error) {
      logger.error('❌ Error reprocessing failed events:', error);
      return 0;
    }
  }

  getWorkerId(): string {
    return this.workerId;
  }

  async shutdown(): Promise<void> {
    logger.info('🔌 Shutting down IssuanceService...');
    await this.eventService.shutdown();
    logger.info('✅ IssuanceService shut down complete');
  }
}