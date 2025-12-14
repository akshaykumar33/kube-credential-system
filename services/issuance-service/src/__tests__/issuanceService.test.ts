import { IssuanceService } from '../services/issuanceService';
import { database } from '../utils/database';
import { EventService } from '../services/eventService';
import { CredentialRequest } from '../models/credential';

jest.mock('../utils/database');
jest.mock('../services/eventService');

const mockDatabase = database as jest.Mocked<typeof database>;
const MockedEventService = EventService as jest.MockedClass<typeof EventService>;

describe('IssuanceService', () => {
  let issuanceService: IssuanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    issuanceService = new IssuanceService();
  });

  const sampleRequest: CredentialRequest = {
    holderName: 'Jane Doe',
    credentialType: 'University Degree',
    issuerName: 'Test University',
    expiryDate: '2030-01-01',
    metadata: { program: 'Computer Science' }
  };

  it('issues credential when unique', async () => {
    mockDatabase.checkIfCredentialExists.mockResolvedValue(false);
    mockDatabase.insertCredential.mockResolvedValue();
    MockedEventService.prototype.publishCredentialIssued.mockResolvedValue();

    const response = await issuanceService.issueCredential(sampleRequest);

    expect(response.success).toBe(true);
    expect(mockDatabase.insertCredential).toHaveBeenCalledTimes(1);
    expect(MockedEventService.prototype.publishCredentialIssued).toHaveBeenCalledTimes(1);
  });

  it('returns conflict when credential exists', async () => {
    mockDatabase.checkIfCredentialExists.mockResolvedValue(true);

    const response = await issuanceService.issueCredential(sampleRequest);

    expect(response.success).toBe(false);
    expect(response.message).toContain('Credential already exists');
    expect(mockDatabase.insertCredential).not.toHaveBeenCalled();
  });

  it('propagates errors when insert fails', async () => {
    mockDatabase.checkIfCredentialExists.mockResolvedValue(false);
    mockDatabase.insertCredential.mockRejectedValue(new Error('insert failed'));

    await expect(issuanceService.issueCredential(sampleRequest)).rejects.toThrow('Failed to issue credential');
  });
});
