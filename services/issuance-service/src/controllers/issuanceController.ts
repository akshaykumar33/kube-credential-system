import { Request, Response } from 'express';
import { IssuanceService } from '../services/issuanceService';
import { CredentialRequest } from '../models/credential';
import { logger } from '../middlewares/logger';

export class IssuanceController {
  private issuanceService: IssuanceService;

  constructor() {
    this.issuanceService = new IssuanceService();
  }

  issueCredential = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentialRequest: CredentialRequest = req.body;

      if (!credentialRequest.holderName || !credentialRequest.credentialType || !credentialRequest.issuerName) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: holderName, credentialType, issuerName',
          workerId: this.issuanceService.getWorkerId()
        });
        return;
      }

      const result = await this.issuanceService.issueCredential(credentialRequest);

      if (!result.success) {
        res.status(409).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Issuance controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        workerId: this.issuanceService.getWorkerId()
      });
    }
  };

  getHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = await this.issuanceService.getMetrics();

      res.status(200).json({
        service: 'issuance-service',
        status: 'healthy',
        workerId: this.issuanceService.getWorkerId(),
        timestamp: new Date().toISOString(),
        metrics
      });
    } catch (error) {
      res.status(500).json({
        service: 'issuance-service',
        status: 'unhealthy',
        error:  error instanceof Error ? error.message : String(error)
      });
    }
  };

  getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = await this.issuanceService.getMetrics();
      res.status(200).json(metrics);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get metrics',
        error:  error instanceof Error ? error.message : String(error)
      });
    }
  };

  reprocessFailedEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const reprocessedCount = await this.issuanceService.reprocessFailedEvents();
      res.status(200).json({
        success: true,
        message: `Reprocessed ${reprocessedCount} failed events`,
        reprocessedCount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to reprocess events',
        error:  error instanceof Error ? error.message : String(error)
      });
    }
  };
}