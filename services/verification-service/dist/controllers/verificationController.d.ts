import { Request, Response } from 'express';
export declare class VerificationController {
    private verificationService;
    private eventSubscriber;
    constructor();
    private startEventSubscriber;
    verifyCredential: (req: Request, res: Response) => Promise<void>;
    getHealth: (req: Request, res: Response) => Promise<void>;
    getMetrics: (req: Request, res: Response) => Promise<void>;
    getSyncedCredentials: (req: Request, res: Response) => Promise<void>;
    reprocessFailedEvents: (req: Request, res: Response) => Promise<void>;
    getEventStatus: (req: Request, res: Response) => Promise<void>;
    shutdown(): Promise<void>;
}
