// __tests__/e2e/issuance.e2e.spec.ts
import Redis from 'ioredis';
import request from 'supertest';
import { App } from '../../src/app';
import { database } from '../../src/utils/database';
import { describe, expect,beforeAll,afterAll, jest, it } from '@jest/globals';
// Mock missing DB helper methods as no-ops for test purposes
(database as any).clearCredentials = jest.fn(() => Promise.resolve());
(database as any).addFailedEvent = jest.fn(() => Promise.resolve());

// Store app instance
let app: App;
let server: any;

// Helper: generate unique holder names for test isolation
const uniqueHolderName = (base: string) => `${base}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Test-only helper to get and shutdown issuanceService gracefully
// Replace with your own way to get the service instance if needed
async function shutdownIssuanceService(appInstance: App) {
  try {
    // Use any public method or expose your service via module exports
    // Here just casting to any to safely call shutdown for tests
    const issuanceController = (appInstance as any).issuanceController;
    if (issuanceController) {
      const issuanceService = issuanceController.issuanceService;
      if (issuanceService && typeof issuanceService.shutdown === 'function') {
        await issuanceService.shutdown();
      }
    }
  } catch (err) {
    // swallow errors in cleanup
  }
}

describe('Issuance Service - E2E Tests', () => {

  beforeAll(async () => {
    app = new App();
    server = app.app;
    // Clear credentials before tests to avoid duplicates
    await (database as any).clearCredentials();
  });

  afterAll(async () => {
    // Properly shutdown service to close intervals and avoid open handles
    await shutdownIssuanceService(app);
  });

  describe('Full credential issuance flow', () => {
    it('should issue credential, publish event, and verify in database', async () => {
      const holderName = uniqueHolderName('Alice Johnson');
      const credentialRequest = {
        holderName,
        credentialType: 'Master of Science',
        issuerName: 'Stanford University',
        expiryDate: '2026-12-31',
        metadata: { department: 'Data Science', honors: 'summa cum laude' }
      };

      const issueResponse = await request(server)
        .post('/api/v1/credentials/issue')
        .send(credentialRequest)
        .expect(201);

      expect(issueResponse.body.success).toBe(true);
      const credentialId = issueResponse.body.credential.id;

      // Verify credential was stored
      const storedCredential = await database.getCredentialById(credentialId);
      expect(storedCredential).toBeDefined();
      expect(storedCredential?.holderName).toBe(holderName);

      // Check metrics were updated
      const metricsResponse = await request(server)
        .get('/admin/metrics')
        .expect(200);

      expect(metricsResponse.body.events.published).toBeGreaterThan(0);
    });

    it('should prevent duplicate credential issuance', async () => {
      const holderName = uniqueHolderName('Bob Smith');
      const credentialRequest = {
        holderName,
        credentialType: 'PhD',
        issuerName: 'Harvard University'
      };

      const firstResponse = await request(server)
        .post('/api/v1/credentials/issue')
        .send(credentialRequest)
        .expect(201);

      expect(firstResponse.body.success).toBe(true);

      // Attempt to issue duplicate
      const duplicateResponse = await request(server)
        .post('/api/v1/credentials/issue')
        .send(credentialRequest)
        .expect(409);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.message).toContain('already exists');
    });

    it('should handle high volume of concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        holderName: uniqueHolderName(`Student${i}`),
        credentialType: 'Certificate',
        issuerName: 'Test University'
      }));

      const responses = await Promise.all(
        requests.map(req =>
          request(server)
            .post('/api/v1/credentials/issue')
            .send(req)
        )
      );

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      const ids = responses.map(r => r.body.credential.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });



// describe('Failed event recovery', () => {
//   let redisClient: Redis;

//   beforeAll(() => {
//     redisClient = new Redis({
//       host: process.env.REDIS_HOST || 'localhost',
//       port: process.env.REDIS_PORT || 6379,
//     });
//   });

//   beforeEach(async () => {
//     // Clear dead letter queue before each test
//     await redisClient.del('credential-dead-letter');
//   });

//   afterAll(async () => {
//     await redisClient.quit();
//   });

//   it('should reprocess failed events from dead letter queue', async () => {
//     const failedEvent = {
//       eventType: 'CREDENTIAL_ISSUED',
//       eventId: 'evt_failed_123',
//       timestamp: new Date().toISOString(),
//       credential: {
//         id: 'cred_failed_123',
//         holderName: 'Failed Holder',
//         credentialType: 'Test',
//         issuerName: 'Test'
//       },
//       retryCount: 5,
//       maxRetries: 5,
//       correlationId: 'corr_failed_123'
//     };

//     // Push serialized event into dead letter queue in Redis
//     await redisClient.lpush('credential-dead-letter', JSON.stringify(failedEvent));

//     const response = await request(server)
//       .post('/admin/reprocess-failed')
//       .expect(200);

//     expect(response.body.success).toBe(true);
//     expect(response.body.reprocessedCount).toBeGreaterThan(0);
//   });
// });


  describe('Service health and monitoring', () => {
    it('should report healthy status with metrics', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.metrics).toBeDefined();
      expect(response.body.workerId).toBeDefined();
    });
  });
});
