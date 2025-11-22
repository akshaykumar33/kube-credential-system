// __tests__/unit/issuanceService.unit.spec.ts

import { IssuanceService } from '../../src/services/issuanceService';
import { database } from '../../src/utils/database';
import { EventService } from '../../src/services/eventService';
import { 
  validCredentialRequest, 
  mockIssuedCredential 
} from '../fixtures/issuance.fixtures';
import { describe, test, expect, beforeEach, beforeAll, jest, it, afterEach } from '@jest/globals';

// Mock dependencies
jest.mock('../../src/utils/database');
jest.mock('../../src/middlewares/logger');

// Mock EventService with proper methods
jest.mock('../../src/services/eventService', () => {
  return {
    EventService: jest.fn().mockImplementation(() => {
      return {
        publishCredentialIssued: jest.fn(() => Promise.resolve(undefined)),
        getMetrics: jest.fn(() => Promise.resolve({
          published: 0,
          failed: 0,
          retried: 0,
          deadLettered: 0
        })),
        getQueueStats: jest.fn(() => Promise.resolve({
          retryQueueSize: 0,
          deadLetterSize: 0,
          status: 'healthy'
        })),
        reprocessDeadLetterQueue: jest.fn(() => Promise.resolve(0)),
        shutdown: jest.fn(() => Promise.resolve(undefined))
      };
    })
  };
});

describe('IssuanceService - Unit Tests', () => {
  let issuanceService: IssuanceService;
  let mockEventService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    issuanceService = new IssuanceService();
    mockEventService = (issuanceService as any).eventService;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('issueCredential', () => {
    it('should successfully issue a credential when valid request provided', async () => {
      // Arrange
      (database.checkIfCredentialExists as any) = jest.fn(() => Promise.resolve(false));
      (database.insertCredential as any) = jest.fn(() => Promise.resolve(undefined));
      mockEventService.publishCredentialIssued = jest.fn(() => Promise.resolve(undefined));

      // Act
      const result = await issuanceService.issueCredential(validCredentialRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.credential).toBeDefined();
      expect(result.credential?.holderName).toBe(validCredentialRequest.holderName);
      expect(result.credential?.credentialType).toBe(validCredentialRequest.credentialType);
      expect(database.checkIfCredentialExists).toHaveBeenCalledWith(
        validCredentialRequest.holderName,
        validCredentialRequest.credentialType,
        validCredentialRequest.issuerName
      );
      expect(database.insertCredential).toHaveBeenCalledTimes(1);
      expect(mockEventService.publishCredentialIssued).toHaveBeenCalledTimes(1);
    });

    it('should return failure when credential already exists', async () => {
      // Arrange
      (database.checkIfCredentialExists as any) = jest.fn(() => Promise.resolve(true));
      (database.insertCredential as any) = jest.fn(() => Promise.resolve(undefined));
      mockEventService.publishCredentialIssued = jest.fn(() => Promise.resolve(undefined));

      // Act
      const result = await issuanceService.issueCredential(validCredentialRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
      expect(database.insertCredential).not.toHaveBeenCalled();
      expect(mockEventService.publishCredentialIssued).not.toHaveBeenCalled();
    });

    it('should generate unique credential ID for each issuance', async () => {
      // Arrange
      (database.checkIfCredentialExists as any) = jest.fn(() => Promise.resolve(false));
      (database.insertCredential as any) = jest.fn(() => Promise.resolve(undefined));
      mockEventService.publishCredentialIssued = jest.fn(() => Promise.resolve(undefined));

      // Act
      const result1 = await issuanceService.issueCredential(validCredentialRequest);
      const result2 = await issuanceService.issueCredential(validCredentialRequest);

      // Assert
      expect(result1.credential?.id).toBeDefined();
      expect(result2.credential?.id).toBeDefined();
      expect(result1.credential?.id).not.toBe(result2.credential?.id);
    });

    it('should throw error when database insertion fails', async () => {
      // Arrange
      (database.checkIfCredentialExists as any) = jest.fn(() => Promise.resolve(false));
      (database.insertCredential as any) = jest.fn(() => Promise.reject(new Error('Database connection failed')));
      mockEventService.publishCredentialIssued = jest.fn(() => Promise.resolve(undefined));

      // Act & Assert
      await expect(
        issuanceService.issueCredential(validCredentialRequest)
      ).rejects.toThrow('Failed to issue credential');
    });

    it('should set correct issue date in YYYY-MM-DD format', async () => {
      // Arrange
      (database.checkIfCredentialExists as any) = jest.fn(() => Promise.resolve(false));
      (database.insertCredential as any) = jest.fn(() => Promise.resolve(undefined));
      mockEventService.publishCredentialIssued = jest.fn(() => Promise.resolve(undefined));

      // Act
      const result = await issuanceService.issueCredential(validCredentialRequest);

      // Assert
      expect(result.credential?.issueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should include workerId and issuedBy fields', async () => {
      // Arrange
      (database.checkIfCredentialExists as any) = jest.fn(() => Promise.resolve(false));
      (database.insertCredential as any) = jest.fn(() => Promise.resolve(undefined));
      mockEventService.publishCredentialIssued = jest.fn(() => Promise.resolve(undefined));

      // Act
      const result = await issuanceService.issueCredential(validCredentialRequest);

      // Assert
      expect(result.credential?.workerId).toBeDefined();
      expect(result.credential?.issuedBy).toContain('worker-');
      expect(result.workerId).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return combined metrics from event service', async () => {
      // Arrange
      const mockEventMetrics = {
        published: 100,
        failed: 5,
        retried: 3,
        deadLettered: 1
      };
      const mockQueueStats = {
        retryQueueSize: 2,
        deadLetterSize: 1,
        status: 'healthy' as const
      };

      mockEventService.getMetrics = jest.fn(() => Promise.resolve(mockEventMetrics));
      mockEventService.getQueueStats = jest.fn(() => Promise.resolve(mockQueueStats));

      // Act
      const metrics = await issuanceService.getMetrics();

      // Assert
      expect(metrics.workerId).toBeDefined();
      expect(metrics.events).toEqual(mockEventMetrics);
      expect(metrics.queues).toEqual(mockQueueStats);
      expect(metrics.timestamp).toBeDefined();
    });

    it('should return error metrics when event service fails', async () => {
      // Arrange
      mockEventService.getMetrics = jest.fn(() => Promise.reject(new Error('Redis connection failed')));

      // Act
      const metrics = await issuanceService.getMetrics();

      // Assert
      expect(metrics.workerId).toBeDefined();
      expect(metrics.error).toBeDefined();
      expect(metrics.error).toContain('Redis connection failed');
    });
  });

  describe('reprocessFailedEvents', () => {
    it('should successfully reprocess failed events', async () => {
      // Arrange
      mockEventService.reprocessDeadLetterQueue = jest.fn(() => Promise.resolve(5));

      // Act
      const count = await issuanceService.reprocessFailedEvents();

      // Assert
      expect(count).toBe(5);
      expect(mockEventService.reprocessDeadLetterQueue).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when reprocessing fails', async () => {
      // Arrange
      mockEventService.reprocessDeadLetterQueue = jest.fn(() => 
        Promise.reject(new Error('Reprocessing failed'))
      );

      // Act
      const count = await issuanceService.reprocessFailedEvents();

      // Assert
      expect(count).toBe(0);
    });
  });

  describe('getWorkerId', () => {
    it('should return workerId', () => {
      // Act
      const workerId = issuanceService.getWorkerId();

      // Assert
      expect(workerId).toBeDefined();
      expect(typeof workerId).toBe('string');
    });
  });

  describe('shutdown', () => {
    it('should call event service shutdown', async () => {
      // Arrange
      mockEventService.shutdown = jest.fn(() => Promise.resolve(undefined));

      // Act
      await issuanceService.shutdown();

      // Assert
      expect(mockEventService.shutdown).toHaveBeenCalledTimes(1);
    });
  });
});
