import { VerificationRequest, VerificationResponse } from '../models/verification';
export declare class VerificationService {
    private workerId;
    constructor();
    verifyCredential(verificationRequest: VerificationRequest): Promise<VerificationResponse>;
    getMetrics(): Promise<any>;
    getWorkerId(): string;
}
