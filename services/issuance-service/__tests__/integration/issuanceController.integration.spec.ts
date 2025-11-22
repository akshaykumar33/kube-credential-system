// __tests__/integration/issuanceController.integration.spec.ts

import request from 'supertest';
import { App } from '../../src/app';
import { database } from '../../src/utils/database';
import { validCredentialRequest, invalidCredentialRequest } from '../fixtures/issuance.fixtures';

// Mock dependencies
jest.mock('../../src/utils/database');
jest.mock('../../src/services/eventService');
jest.mock('../../src/middlewares/logger');

describe('IssuanceController - Integration Tests', () => {
  let app: App;
  let server: any;

  beforeAll(() => {
    app = new App();
    server = app.app;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/credentials/issue', () => {
    it('should issue credential successfully with valid request', async () => {
      // Arrange
      (database.checkIfCredentialExists as any) = jest.fn(() => Promise.resolve(false));
      (database.insertCredential as any) = jest.fn(() => Promise.resolve(undefined));

      // Act
      const response = await request(server)
        .post('/api/v1/credentials/issue')
        .send(validCredentialRequest)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.credential).toBeDefined();
      expect(response.body.credential.holderName).toBe(validCredentialRequest.holderName);
      expect(response.body.workerId).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      // Act
      const response = await request(server)
        .post('/api/v1/credentials/issue')
        .send(invalidCredentialRequest)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 409 when credential already exists', async () => {
      // Arrange
      (database.checkIfCredentialExists as any) = jest.fn(() => Promise.resolve(true));

      // Act
      const response = await request(server)
        .post('/api/v1/credentials/issue')
        .send(validCredentialRequest)
        .expect(409);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      (database.checkIfCredentialExists as any) = jest.fn(() => Promise.reject(new Error('Database error')));

      // Act
      const response = await request(server)
        .post('/api/v1/credentials/issue')
        .send(validCredentialRequest)
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Internal server error');
    });
  });

  // ...rest of your tests with the same casting for all database.* mocks
});
