"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationController = void 0;
const verificationService_1 = require("../services/verificationService");
const eventSubscriber_1 = require("../services/eventSubscriber");
const logger_1 = require("../middlewares/logger");
class VerificationController {
    constructor() {
        // Main credential verification endpoint
        this.verifyCredential = async (req, res) => {
            try {
                const verificationRequest = req.body;
                if (!verificationRequest.id) {
                    res.status(400).json({
                        success: false,
                        message: 'Missing required field: id',
                        workerId: this.verificationService.getWorkerId(),
                        timestamp: new Date().toISOString(),
                        isValid: false
                    });
                    return;
                }
                logger_1.logger.info(`🔍 Verifying credential: ${verificationRequest.id}`);
                const result = await this.verificationService.verifyCredential(verificationRequest);
                if (!result.success) {
                    res.status(404).json(result);
                    return;
                }
                res.status(200).json(result);
            }
            catch (error) {
                logger_1.logger.error('❌ Verification controller error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    workerId: this.verificationService.getWorkerId(),
                    timestamp: new Date().toISOString(),
                    isValid: false
                });
            }
        };
        // Health check endpoint
        this.getHealth = async (req, res) => {
            try {
                const eventMetrics = await this.eventSubscriber.getMetrics();
                res.status(200).json({
                    service: 'verification-service',
                    status: 'healthy',
                    workerId: this.verificationService.getWorkerId(),
                    timestamp: new Date().toISOString(),
                    eventSubscriber: {
                        isListening: eventMetrics.isListening,
                        processedSuccess: eventMetrics.processedSuccess,
                        processedFailed: eventMetrics.processedFailed
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('❌ Health check error:', error);
                res.status(500).json({
                    service: 'verification-service',
                    status: 'unhealthy',
                    error: error instanceof Error ? error.message : String(error),
                    timestamp: new Date().toISOString()
                });
            }
        };
        // Admin endpoint - Get comprehensive metrics
        this.getMetrics = async (req, res) => {
            try {
                const eventMetrics = await this.eventSubscriber.getMetrics();
                const verificationMetrics = await this.verificationService.getMetrics();
                res.status(200).json({
                    service: 'verification-service',
                    workerId: this.verificationService.getWorkerId(),
                    timestamp: new Date().toISOString(),
                    events: eventMetrics,
                    verification: verificationMetrics
                });
            }
            catch (error) {
                logger_1.logger.error('❌ Error getting metrics:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get metrics',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        };
        // Admin endpoint - Get recently synced credentials
        this.getSyncedCredentials = async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 10;
                const syncedCredentials = await this.eventSubscriber.getSyncedCredentials(limit);
                res.status(200).json({
                    success: true,
                    syncedCredentials,
                    count: syncedCredentials.length,
                    limit
                });
            }
            catch (error) {
                logger_1.logger.error('❌ Error getting synced credentials:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get synced credentials',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        };
        // Admin endpoint - Reprocess failed events
        this.reprocessFailedEvents = async (req, res) => {
            try {
                logger_1.logger.info('🔄 Manual reprocess of failed verification events requested');
                const reprocessedCount = await this.eventSubscriber.reprocessFailedEvents();
                res.status(200).json({
                    success: true,
                    message: `Reprocessed ${reprocessedCount} failed events`,
                    reprocessedCount,
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                logger_1.logger.error('❌ Error reprocessing failed events:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to reprocess failed events',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        };
        // Admin endpoint - Get event processing status
        this.getEventStatus = async (req, res) => {
            try {
                const metrics = await this.eventSubscriber.getMetrics();
                res.status(200).json({
                    success: true,
                    eventSubscriber: {
                        isListening: metrics.isListening,
                        processedSuccess: metrics.processedSuccess,
                        processedFailed: metrics.processedFailed,
                        failedQueueSize: metrics.failedQueueSize,
                        processedEventsInMemory: metrics.processedEventsInMemory
                    },
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                logger_1.logger.error('❌ Error getting event status:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get event status',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        };
        this.verificationService = new verificationService_1.VerificationService();
        this.eventSubscriber = new eventSubscriber_1.EventSubscriber();
        // Start listening to events
        this.startEventSubscriber();
    }
    async startEventSubscriber() {
        try {
            await this.eventSubscriber.startListening();
            logger_1.logger.info('🎧 Event subscriber started in VerificationController');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to start event subscriber:', error);
        }
    }
    async shutdown() {
        logger_1.logger.info('🔌 Shutting down VerificationController...');
        await this.eventSubscriber.shutdown();
        logger_1.logger.info('✅ VerificationController shut down complete');
    }
}
exports.VerificationController = VerificationController;
//# sourceMappingURL=verificationController.js.map