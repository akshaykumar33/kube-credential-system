// __tests__/fixtures/issuance.fixtures.ts

export const validCredentialRequest = {
  holderName: 'John Doe',
  credentialType: 'Bachelor of Science',
  issuerName: 'MIT University',
  expiryDate: '2025-12-31',
  metadata: {
    department: 'Computer Science',
    gpa: '3.8'
  }
};

export const invalidCredentialRequest = {
  holderName: '',
  credentialType: '',
  issuerName: ''
};

export const mockIssuedCredential = {
  id: 'test-credential-id-123',
  holderName: 'John Doe',
  credentialType: 'Bachelor of Science',
  issueDate: '2024-11-22',
  expiryDate: '2025-12-31',
  issuerName: 'MIT University',
  metadata: {
    department: 'Computer Science',
    gpa: '3.8'
  },
  workerId: 'test-worker-1',
  timestamp: new Date().toISOString(),
  issuedBy: 'worker-test-worker-1'
};

export const mockRedisEvent = {
  eventType: 'CREDENTIAL_ISSUED',
  eventId: 'evt_test_123',
  timestamp: new Date().toISOString(),
  credential: mockIssuedCredential,
  retryCount: 0,
  maxRetries: 5,
  correlationId: 'corr_test_123'
};

export const mockMetrics = {
  workerId: 'test-worker-1',
  events: {
    published: 100,
    failed: 5,
    retried: 3,
    deadLettered: 1
  },
  queues: {
    retryQueueSize: 2,
    deadLetterSize: 1,
    status: 'healthy'
  },
  timestamp: new Date().toISOString()
};
