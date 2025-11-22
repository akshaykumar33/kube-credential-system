import { VerificationService } from '../../src/services/verificationService';
import {database} from '../../src/utils/database';
import { validCredential, invalidCredentialId, errorCredentialId } from '../fixtures/verification.fixtures';
import { describe, expect, beforeEach, jest, it } from '@jest/globals';

jest.mock('../../src/utils/database');

type GetCredentialByIdFunction = (id: string) => Promise<any>;
const mockGetCredentialById = database.getCredentialById as jest.MockedFunction<GetCredentialByIdFunction>;

describe('VerificationService Integration', () => {
  let verificationService: VerificationService;

  // const mockGetCredentialById = database.getCredentialById as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    verificationService = new VerificationService();
  });

  it('verifies a valid credential', async () => {
    mockGetCredentialById.mockResolvedValue(validCredential);

    const res = await verificationService.verifyCredential({ id: validCredential.id });

    expect(res.success).toBe(true);
    expect(res.credential).toEqual(validCredential);
  });

  it('returns failure for invalid credential', async () => {
    mockGetCredentialById.mockResolvedValue(null);

    const res = await verificationService.verifyCredential({ id: invalidCredentialId });

    expect(res.success).toBe(false);
  });

  it('throws on DB error', async () => {
    mockGetCredentialById.mockRejectedValue(new Error('DB error'));

    await expect(verificationService.verifyCredential({ id: errorCredentialId })).rejects.toThrow();
  });
});
