export interface VerificationRequest {
  id: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  credential?: any;
  workerId: string;
  timestamp: string;
  isValid: boolean;
}