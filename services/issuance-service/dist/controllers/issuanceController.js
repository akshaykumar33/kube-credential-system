"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuanceController = void 0;
const issuanceService_1 = require("../services/issuanceService");
const logger_1 = require("../middlewares/logger");
class IssuanceController {
    constructor() {
        this.issueCredential = async (req, res) => {
            try {
                const credentialRequest = req.body;
                if (!credentialRequest.holderName || !credentialRequest.credentialType || !credentialRequest.issuerName) {
                    res.status(400).json({
                        success: false,
                        message: 'Missing required fields: holderName, credentialType, issuerName',
                        workerId: this.issuanceService.getWorkerId()
                    });
                    return;
                }
                const result = await this.issuanceService.issueCredential(credentialRequest);
                if (!result.success) {
                    res.status(409).json(result);
                    return;
                }
                res.status(201).json(result);
            }
            catch (error) {
                logger_1.logger.error('Issuance controller error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    workerId: this.issuanceService.getWorkerId()
                });
            }
        };
        this.getHealth = async (req, res) => {
            try {
                const metrics = await this.issuanceService.getMetrics();
                res.status(200).json({
                    service: 'issuance-service',
                    status: 'healthy',
                    workerId: this.issuanceService.getWorkerId(),
                    timestamp: new Date().toISOString(),
                    metrics
                });
            }
            catch (error) {
                res.status(500).json({
                    service: 'issuance-service',
                    status: 'unhealthy',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        };
        this.getMetrics = async (req, res) => {
            try {
                const metrics = await this.issuanceService.getMetrics();
                res.status(200).json(metrics);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to get metrics',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        };
        this.reprocessFailedEvents = async (req, res) => {
            try {
                const reprocessedCount = await this.issuanceService.reprocessFailedEvents();
                res.status(200).json({
                    success: true,
                    message: `Reprocessed ${reprocessedCount} failed events`,
                    reprocessedCount
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to reprocess events',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        };
        this.issuanceService = new issuanceService_1.IssuanceService();
    }
}
exports.IssuanceController = IssuanceController;
//# sourceMappingURL=issuanceController.js.map