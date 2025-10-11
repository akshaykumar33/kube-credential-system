import express from 'express';
export declare class App {
    app: express.Application;
    private issuanceController;
    constructor();
    private initializeMiddlewares;
    private initializeRoutes;
}
