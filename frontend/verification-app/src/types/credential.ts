export interface VerificationRequest {
  id: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  credential?: Credential;
  workerId: string;
  timestamp: string;
  isValid: boolean;
}

export interface Credential {
  id: string;
  holderName: string;
  credentialType: string;
  issuerName: string;
  issueDate: string;
  expiryDate?: string;
  workerId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}