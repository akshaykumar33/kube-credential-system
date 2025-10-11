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

export interface CredentialRequest {
  holderName: string;
  credentialType: string;
  issuerName: string;
  expiryDate?: string;
  metadata?: Record<string, any>;
}

export interface IssuanceResponse {
  success: boolean;
  message: string;
  credential?: Credential;
  workerId: string;
}