import { database } from '../utils/database';
import { VerificationRequest, VerificationResponse } from '../models/verification';
import { logger } from '../middlewares/logger';
import os from 'os';

export class VerificationService {
  private workerId: string;

  constructor() {
    this.workerId = process.env.POD_NAME?`worker-${process.env.POD_NAME}`:`${os.hostname()}-${process.pid}`;
  }

  async verifyCredential(verificationRequest: VerificationRequest): Promise<VerificationResponse> {
    try {
      const timestamp = new Date().toISOString();
      logger.info(`🔍 Verifying credential: ${verificationRequest.id}`);

      const credential = await database.getCredentialById(verificationRequest.id);

      if (credential) {
        logger.info(`✅ Credential ${verificationRequest.id} found and valid`);
        return {
          success: true,
          message: `Credential verified by worker-${this.workerId}`,
          credential,
          workerId: this.workerId,
          timestamp,
          isValid: true
        };
      }

      logger.warn(`❌ Credential ${verificationRequest.id} not found`);
      return {
        success: false,
        message: `Credential with ID ${verificationRequest.id} not found or invalid`,
        workerId: this.workerId,
        timestamp,
        isValid: false
      };

    } catch (error) {
      logger.error('Error verifying credential:', error);
      throw new Error('Failed to verify credential');
    }
  }

  async getMetrics(): Promise<any> {
    // Could add more verification-specific metrics here
    return {
      workerId: this.workerId,
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }

  getWorkerId(): string {
    return this.workerId;
  }
}