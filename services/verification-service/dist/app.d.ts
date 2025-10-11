import express from 'express';
export declare class App {
    app: express.Application;
    private verificationController;
    constructor();
    private initializeMiddlewares;
    private initializeRoutes;
    private setupGracefulShutdown;
}
