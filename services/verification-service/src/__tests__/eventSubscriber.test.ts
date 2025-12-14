import Redis from 'ioredis';
import { EventSubscriber } from '../services/eventSubscriber';
import { database } from '../utils/database';

jest.mock('ioredis');
jest.mock('../utils/database', () => ({
  database: {
    insertCredential: jest.fn(),
    getCredentialById: jest.fn()
  }
}));
jest.mock('../middlewares/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const mockDatabase = database as jest.Mocked<typeof database>;

describe('EventSubscriber', () => {
  const mockRedisOn = jest.fn();
  const mockRedisGet = jest.fn();
  const mockRedisLlen = jest.fn();
  const mockRedisLpush = jest.fn();
  const mockRedisLtrim = jest.fn();
  const mockRedisLrange = jest.fn();
  const mockRedisHset = jest.fn();
  const mockRedisZadd = jest.fn();
  const mockRedisZremRange = jest.fn();
  const mockRedisZrevrange = jest.fn();
  const mockRedisIncr = jest.fn();
  const mockRedisDel = jest.fn();
  const mockRedisQuit = jest.fn();

  const mockSubscriberOn = jest.fn();
  const mockSubscriberSubscribe = jest.fn();
  const mockSubscriberUnsubscribe = jest.fn();
  const mockSubscriberQuit = jest.fn();

  const mockDuplicate = jest.fn(() => ({
    on: mockSubscriberOn,
    subscribe: mockSubscriberSubscribe,
    unsubscribe: mockSubscriberUnsubscribe,
    quit: mockSubscriberQuit
  }));

  beforeEach(() => {
    jest.clearAllMocks();

    (Redis as unknown as jest.Mock).mockImplementation(() => ({
      on: mockRedisOn,
      duplicate: mockDuplicate,
      quit: mockRedisQuit,
      incr: mockRedisIncr,
      get: mockRedisGet,
      llen: mockRedisLlen,
      lpush: mockRedisLpush,
      ltrim: mockRedisLtrim,
      lrange: mockRedisLrange,
      del: mockRedisDel,
      hset: mockRedisHset,
      zadd: mockRedisZadd,
      zremrangebyrank: mockRedisZremRange,
      zrevrange: mockRedisZrevrange
    }));

    mockRedisGet.mockResolvedValue('0');
    mockRedisLlen.mockResolvedValue(0);
    mockRedisZrevrange.mockResolvedValue([]);
    mockRedisLrange.mockResolvedValue([]);
    mockDatabase.insertCredential.mockResolvedValue();
    mockDatabase.getCredentialById.mockResolvedValue(null);
  });

  it('subscribes to Redis channel and processes new credential events', async () => {
    const subscriber = new EventSubscriber();
    await subscriber.startListening();

    expect(mockSubscriberSubscribe).toHaveBeenCalledWith('credential-events');

    let messageHandler: ((channel: string, message: string) => Promise<void> | void) | undefined;
    mockSubscriberOn.mock.calls.forEach(([event, handler]) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });

    const sampleEvent = {
      eventType: 'CREDENTIAL_ISSUED' as const,
      eventId: 'evt-1',
      timestamp: new Date().toISOString(),
      credential: { id: 'cred-1', holderName: 'Jane', credentialType: 'Degree', issuerName: 'Uni', issueDate: '2024-01-01', workerId: 'worker-1' },
      retryCount: 0,
      correlationId: 'corr-1'
    };

    await messageHandler?.('credential-events', JSON.stringify(sampleEvent));

    expect(mockDatabase.getCredentialById).toHaveBeenCalledWith('cred-1');
    expect(mockDatabase.insertCredential).toHaveBeenCalledWith(expect.objectContaining({ id: 'cred-1' }));
    expect(mockRedisHset).toHaveBeenCalledWith('synced-credentials', 'cred-1', expect.any(String));
    expect(mockRedisZadd).toHaveBeenCalledWith('sync-timeline', expect.any(Number), expect.any(String));
  });

  it('returns parsed metrics and reprocesses failed events', async () => {
    mockRedisGet.mockResolvedValueOnce('5');
    mockRedisGet.mockResolvedValueOnce('1');
    mockRedisGet.mockResolvedValueOnce('2');
    mockRedisLlen.mockResolvedValueOnce(3);
    mockRedisLrange.mockResolvedValueOnce([
      JSON.stringify({ message: JSON.stringify({ eventType: 'CREDENTIAL_ISSUED', eventId: 'evt-2', timestamp: new Date().toISOString(), credential: { id: 'cred-2' }, retryCount: 0, correlationId: 'corr-2' }) })
    ]);

    const subscriber = new EventSubscriber();
    const metrics = await subscriber.getMetrics();

    expect(metrics).toEqual(expect.objectContaining({
      processedSuccess: 5,
      processedFailed: 1,
      failedQueueSize: 3
    }));

    await subscriber.reprocessFailedEvents();
    expect(mockRedisDel).toHaveBeenCalledWith('verification-failed-events');
  });
});
