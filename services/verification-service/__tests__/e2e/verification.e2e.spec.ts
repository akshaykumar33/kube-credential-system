import request from 'supertest';
import { App } from '../../src/app';
import { describe, expect, beforeAll, it, afterAll, jest } from '@jest/globals';

// Mock the database module before importing the app if needed
jest.mock('../../src/utils/database', () => ({
  getCredentialById: jest.fn((id: string) => {
    if (id === 'valid-123') {
      return Promise.resolve({ id: 'valid-123', data: 'some valid data' });
    }
    return Promise.resolve(null);
  }),
}));

describe('VerificationController E2E', () => {
  let app: App;

  beforeAll(() => {
    app = new App();
  });

  afterAll(async () => {
    // Properly shutdown server and resources
    
      await app.setupGracefulShutdown();
    
  });

  // it('should verify credential successfully', async () => {
  //   const response = await request(app.app)
  //     .post('/api/v1/credentials/verify')
  //     .send({ id: 'valid-123' });

  //   expect(response.status).toBe(200);
  //   expect(response.body.success).toBe(true);
  // });

  it('should return error for missing id', async () => {
    const response = await request(app.app)
      .post('/api/v1/credentials/verify')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
