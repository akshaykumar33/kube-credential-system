import { EventService } from '../services/eventService';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('EventService', () => {
  const mockPublish = jest.fn();
  const mockZadd = jest.fn();
  const mockGet = jest.fn();
  const mockIncr = jest.fn();
  const mockQuit = jest.fn();
  const mockDuplicate = jest.fn().mockReturnValue({
    publish: mockPublish,
    on: jest.fn(),
    quit: mockQuit
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (Redis as unknown as jest.Mock).mockImplementation(() => ({
      publish: mockPublish,
      zadd: mockZadd,
      get: mockGet,
      incr: mockIncr,
      zrangebyscore: jest.fn().mockResolvedValue([]),
      zrem: jest.fn(),
      zcard: jest.fn().mockResolvedValue(0),
      llen: jest.fn().mockResolvedValue(0),
      lpush: jest.fn(),
      hset: jest.fn(),
      del: jest.fn(),
      duplicate: mockDuplicate,
      on: jest.fn(),
      quit: mockQuit
    }));
  });

  it('publishes events and increments metrics', async () => {
    const service = new EventService();
    await service.publishCredentialIssued({ id: '123' } as any);

    expect(mockPublish).toHaveBeenCalled();
    expect(mockIncr).toHaveBeenCalledWith('metrics:events:published');
  });

  it('falls back to retry queue when publish fails', async () => {
    mockPublish.mockRejectedValueOnce(new Error('fail'));
    const service = new EventService();

    await service.publishCredentialIssued({ id: '123' } as any);

    expect(mockZadd).toHaveBeenCalledWith(
      'credential-retry-queue',
      expect.any(Number),
      expect.any(String)
    );
  });

  it('retrieves metrics with defaults', async () => {
    mockGet.mockResolvedValueOnce('5');
    mockGet.mockResolvedValueOnce(null);
    mockGet.mockResolvedValueOnce('3');
    mockGet.mockResolvedValueOnce('1');

    const service = new EventService();
    const metrics = await service.getMetrics();

    expect(metrics).toEqual({ published: 5, failed: 0, retried: 3, deadLettered: 1 });
  });
});
