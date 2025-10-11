import { CredentialRequest, IssuanceResponse } from '../models/credential';
export declare class IssuanceService {
    private workerId;
    private eventService;
    constructor();
    issueCredential(credentialRequest: CredentialRequest): Promise<IssuanceResponse>;
    getMetrics(): Promise<any>;
    reprocessFailedEvents(): Promise<number>;
    getWorkerId(): string;
    shutdown(): Promise<void>;
}
