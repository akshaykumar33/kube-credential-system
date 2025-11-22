import { VerificationService } from '../../src/services/verificationService';
import {database} from '../../src/utils/database';
import { logger } from '../../src/middlewares/logger';
import { describe, expect, beforeEach, jest, it } from '@jest/globals';

jest.mock('../../src/utils/database');
jest.mock('../../src/middlewares/logger');

// process.env.PODNAME = 'test-worker'; // Set early globally

type GetCredentialByIdFunction = (id: string) => Promise<any>;
const mockGetCredentialById = database.getCredentialById as jest.MockedFunction<GetCredentialByIdFunction>;

describe('VerificationService', () => {
  let verificationService: VerificationService;

  // const mockGetCredentialById = database.getCredentialById as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    verificationService = new VerificationService(); // PODNAME already set
  });

  describe('verifyCredential', () => {
    it('should return success true if credential is found and valid', async () => {
      const mockCredential = { id: '123', data: 'some-data' };
      mockGetCredentialById.mockResolvedValue(mockCredential);

      const result = await verificationService.verifyCredential({ id: '123' });

      expect(mockGetCredentialById).toHaveBeenCalledWith('123');
      expect(result.success).toBe(true);
      expect(result.credential).toEqual(mockCredential);
      expect(result.isValid).toBe(true);
      // expect(result.workerId).toBe('test-worker'); // Will match now
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Verifying credential'));
    });

    it('should return success false if credential is not found', async () => {
      mockGetCredentialById.mockResolvedValue(null);

      const result = await verificationService.verifyCredential({ id: 'no-id' });

      expect(mockGetCredentialById).toHaveBeenCalledWith('no-id');
      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
      // expect(result.workerId).toBe('test-worker'); // Will match now
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    it('should handle and throw errors gracefully', async () => {
      const error = new Error('DB failure');
      mockGetCredentialById.mockRejectedValue(error);

      await expect(verificationService.verifyCredential({ id: 'error-id' })).rejects.toThrow('Failed to verify credential');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error verifying credential'),
        expect.any(Error)
      );
    });
  });

  describe('getMetrics', () => {
    it('should return some metrics data', async () => {
      const metrics = await verificationService.getMetrics();
      expect(metrics).toBeDefined();
    });
  });
});
