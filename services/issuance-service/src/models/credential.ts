export interface Credential {
  id: string;
  holderName: string;
  credentialType: string;
  issueDate: string;
  expiryDate?: string;
  issuerName: string;
  metadata?: Record<string, any>;
}

export interface IssuedCredential extends Credential {
  workerId: string;
  timestamp: string;
  issuedBy: string;
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
  credential?: IssuedCredential;
  workerId: string;
}