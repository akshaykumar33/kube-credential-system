import { VerificationController } from '../controllers/verificationController';
import { VerificationService } from '../services/verificationService';
import { EventSubscriber } from '../services/eventSubscriber';
import { Request, Response } from 'express';

jest.mock('../services/verificationService');
jest.mock('../services/eventSubscriber');

describe('VerificationController', () => {
  let controller: VerificationController;
  let mockVerificationService: jest.Mocked<VerificationService>;
  let mockEventSubscriber: jest.Mocked<EventSubscriber>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new VerificationController();
    mockVerificationService = (VerificationService as jest.MockedClass<typeof VerificationService>).mock
      .instances[0] as jest.Mocked<VerificationService>;
    mockEventSubscriber = (EventSubscriber as jest.MockedClass<typeof EventSubscriber>).mock
      .instances[0] as jest.Mocked<EventSubscriber>;
    mockReq = { body: {}, query: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('validates verifyCredential payload', async () => {
    await controller.verifyCredential(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('returns service response for valid request', async () => {
    mockReq.body = { id: '123' };
    mockVerificationService.verifyCredential.mockResolvedValue({ success: true, isValid: true } as any);

    await controller.verifyCredential(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when service reports not found', async () => {
    mockReq.body = { id: '123' };
    mockVerificationService.verifyCredential.mockResolvedValue({ success: false } as any);

    await controller.verifyCredential(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  it('getMetrics merges service + subscriber data', async () => {
    mockEventSubscriber.getMetrics.mockResolvedValue({ processedSuccess: 1 } as any);
    mockVerificationService.getMetrics.mockResolvedValue({ status: 'active' });

    await controller.getMetrics(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      events: expect.objectContaining({ processedSuccess: 1 }),
      verification: expect.objectContaining({ status: 'active' })
    }));
  });
});
