import { Request, Response } from 'express';
export declare class IssuanceController {
    private issuanceService;
    constructor();
    issueCredential: (req: Request, res: Response) => Promise<void>;
    getHealth: (req: Request, res: Response) => Promise<void>;
    getMetrics: (req: Request, res: Response) => Promise<void>;
    reprocessFailedEvents: (req: Request, res: Response) => Promise<void>;
}
