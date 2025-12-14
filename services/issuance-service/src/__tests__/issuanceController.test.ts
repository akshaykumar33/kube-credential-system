import { IssuanceController } from '../controllers/issuanceController';
import { IssuanceService } from '../services/issuanceService';
import { Request, Response } from 'express';

jest.mock('../services/issuanceService');

describe('IssuanceController', () => {
  let controller: IssuanceController;
  let mockService: jest.Mocked<IssuanceService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new IssuanceController();
    mockService = (IssuanceService as jest.MockedClass<typeof IssuanceService>).mock
      .instances[0] as jest.Mocked<IssuanceService>;
    mockReq = { body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('returns 400 when required fields missing', async () => {
    await controller.issueCredential(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('returns 201 when service succeeds', async () => {
    mockReq.body = { holderName: 'Jane', credentialType: 'Degree', issuerName: 'Uni' };
    mockService.issueCredential.mockResolvedValue({ success: true, workerId: 'worker-1', message: 'ok' });

    await controller.issueCredential(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 409 when service reports conflict', async () => {
    mockReq.body = { holderName: 'Jane', credentialType: 'Degree', issuerName: 'Uni' };
    mockService.issueCredential.mockResolvedValue({ success: false, workerId: 'worker-1', message: 'exists' });

    await controller.issueCredential(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(409);
  });
});
