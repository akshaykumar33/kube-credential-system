import axios from 'axios';
import { CredentialRequest, IssuanceResponse } from '../types/credential';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// Use runtime config, fallback to localhost
const API_BASE_URL =
  (window as any)._env_?.API_BASE_URL || import.meta.env.VITE_API_URL || 'http://3.110.212.85:3000'  ||'http://localhost:3000';

  console.log("API_BASE_URL in issuance-app",API_BASE_URL,import.meta.env.VITE_API_URL,(window as any)._env_?.API_BASE_URL)
export class ApiService {
  async issueCredential(credentialRequest: CredentialRequest): Promise<IssuanceResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/credentials/issue`,
        credentialRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to issue credential');
      }
      throw new Error('Network error: Unable to connect to issuance service');
    }
  }

  async checkHealth(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      throw new Error('Health check failed');
    }
  }
}

export const apiService = new ApiService();