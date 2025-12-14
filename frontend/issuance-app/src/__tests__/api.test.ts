import { vi } from 'vitest';
import axios from 'axios';
import { apiService } from '../services/api';

vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('issues credential successfully', async () => {
    mockedAxios.post.mockResolvedValue({ data: { success: true } });

    const result = await apiService.issueCredential({ holderName: 'Jane', credentialType: 'Degree', issuerName: 'Uni' });

    expect(result.success).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/credentials/issue'),
      expect.any(Object),
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it('throws on API error with message', async () => {
    mockedAxios.post.mockRejectedValue({ response: { data: { message: 'failed' } } });

    await expect(
      apiService.issueCredential({ holderName: 'Jane', credentialType: 'Degree', issuerName: 'Uni' })
    ).rejects.toThrow('failed');
  });
});
