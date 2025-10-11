import { Request, Response } from 'express';
import { VerificationService } from '../services/verificationService';
import { EventSubscriber } from '../services/eventSubscriber';
import { VerificationRequest } from '../models/verification';
import { logger } from '../middlewares/logger';

export class VerificationController {
  private verificationService: VerificationService;
  private eventSubscriber: EventSubscriber;

  constructor() {
    this.verificationService = new VerificationService();
    this.eventSubscriber = new EventSubscriber();

    // Start listening to events
    this.startEventSubscriber();
  }

  private async startEventSubscriber(): Promise<void> {
    try {
      await this.eventSubscriber.startListening();
      logger.info('🎧 Event subscriber started in VerificationController');
    } catch (error) {
      logger.error('❌ Failed to start event subscriber:', error);
    }
  }

  // Main credential verification endpoint
  verifyCredential = async (req: Request, res: Response): Promise<void> => {
    try {
      const verificationRequest: VerificationRequest = req.body;

      if (!verificationRequest.id) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: id',
          workerId: this.verificationService.getWorkerId(),
          timestamp: new Date().toISOString(),
          isValid: false
        });
        return;
      }

      logger.info(`🔍 Verifying credential: ${verificationRequest.id}`);

      const result = await this.verificationService.verifyCredential(verificationRequest);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);

    } catch (error) {
      logger.error('❌ Verification controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        workerId: this.verificationService.getWorkerId(),
        timestamp: new Date().toISOString(),
        isValid: false
      });
    }
  };

  // Health check endpoint
  getHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const eventMetrics = await this.eventSubscriber.getMetrics();

      res.status(200).json({
        service: 'verification-service',
        status: 'healthy',
        workerId: this.verificationService.getWorkerId(),
        timestamp: new Date().toISOString(),
        eventSubscriber: {
          isListening: eventMetrics.isListening,
          processedSuccess: eventMetrics.processedSuccess,
          processedFailed: eventMetrics.processedFailed
        }
      });
    } catch (error) {
      logger.error('❌ Health check error:', error);
      res.status(500).json({
        service: 'verification-service',
        status: 'unhealthy',
        error:  error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  };

  // Admin endpoint - Get comprehensive metrics
  getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const eventMetrics = await this.eventSubscriber.getMetrics();
      const verificationMetrics = await this.verificationService.getMetrics();

      res.status(200).json({
        service: 'verification-service',
        workerId: this.verificationService.getWorkerId(),
        timestamp: new Date().toISOString(),
        events: eventMetrics,
        verification: verificationMetrics
      });

    } catch (error) {
      logger.error('❌ Error getting metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get metrics',
        error:  error instanceof Error ? error.message : String(error)
      });
    }
  };

  // Admin endpoint - Get recently synced credentials
  getSyncedCredentials = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const syncedCredentials = await this.eventSubscriber.getSyncedCredentials(limit);

      res.status(200).json({
        success: true,
        syncedCredentials,
        count: syncedCredentials.length,
        limit
      });

    } catch (error) {
      logger.error('❌ Error getting synced credentials:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get synced credentials',
        error:  error instanceof Error ? error.message : String(error)
      });
    }
  };

  // Admin endpoint - Reprocess failed events
  reprocessFailedEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('🔄 Manual reprocess of failed verification events requested');

      const reprocessedCount = await this.eventSubscriber.reprocessFailedEvents();

      res.status(200).json({
        success: true,
        message: `Reprocessed ${reprocessedCount} failed events`,
        reprocessedCount,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ Error reprocessing failed events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reprocess failed events',
        error:  error instanceof Error ? error.message : String(error)
      });
    }
  };

  // Admin endpoint - Get event processing status
  getEventStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = await this.eventSubscriber.getMetrics();

      res.status(200).json({
        success: true,
        eventSubscriber: {
          isListening: metrics.isListening,
          processedSuccess: metrics.processedSuccess,
          processedFailed: metrics.processedFailed,
          failedQueueSize: metrics.failedQueueSize,
          processedEventsInMemory: metrics.processedEventsInMemory
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ Error getting event status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get event status',
        error:  error instanceof Error ? error.message : String(error)
      });
    }
  };

  async shutdown(): Promise<void> {
    logger.info('🔌 Shutting down VerificationController...');
    await this.eventSubscriber.shutdown();
    logger.info('✅ VerificationController shut down complete');
  }
}