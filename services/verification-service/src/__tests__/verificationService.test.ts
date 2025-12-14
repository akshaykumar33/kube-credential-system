import { VerificationService } from '../services/verificationService';
import { database } from '../utils/database';

jest.mock('../utils/database');

const mockDatabase = database as jest.Mocked<typeof database>;

describe('VerificationService', () => {
  let service: VerificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VerificationService();
  });

  it('returns success when credential exists', async () => {
    mockDatabase.getCredentialById.mockResolvedValue({ id: '123' });

    const response = await service.verifyCredential({ id: '123' });

    expect(response.success).toBe(true);
    expect(response.isValid).toBe(true);
  });

  it('returns failure when credential missing', async () => {
    mockDatabase.getCredentialById.mockResolvedValue(null);

    const response = await service.verifyCredential({ id: '123' });

    expect(response.success).toBe(false);
    expect(response.isValid).toBe(false);
  });

  it('throws when database errors', async () => {
    mockDatabase.getCredentialById.mockRejectedValue(new Error('db error'));

    await expect(service.verifyCredential({ id: '1' })).rejects.toThrow('Failed to verify credential');
  });
});
