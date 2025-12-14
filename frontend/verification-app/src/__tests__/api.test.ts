import axios from 'axios';
import { apiService } from '../services/api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('verification apiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns response payload on success', async () => {
    mockedAxios.post.mockResolvedValue({ data: { success: true, isValid: true } });

    const result = await apiService.verifyCredential({ id: 'cred-1' });

    expect(result.success).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/credentials/verify'),
      { id: 'cred-1' },
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it('returns server payload on error response', async () => {
    mockedAxios.post.mockRejectedValue({ response: { data: { success: false, message: 'invalid' } } });

    const result = await apiService.verifyCredential({ id: 'cred-1' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('invalid');
  });

  it('throws on network failure', async () => {
    mockedAxios.post.mockRejectedValue({});

    await expect(apiService.verifyCredential({ id: 'cred-1' })).rejects.toThrow('Network error');
  });
});
