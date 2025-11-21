import axios from 'axios';
import { VerificationRequest, VerificationResponse } from '../types/credential';

// Use runtime config, fallback to localhost
const API_BASE_URL =
  (window as any).__APP_CONFIG__?.API_BASE_URL || 'http://3.110.212.85:3001' ||import.meta.env.VITE_API_URL|| 'http://localhost:3001';
export class ApiService {
  async verifyCredential(verificationRequest: VerificationRequest): Promise<VerificationResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/credentials/verify`,
        verificationRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Network error: Unable to connect to verification service');
    }
  }
}

export const apiService = new ApiService();