"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const body_parser_1 = __importDefault(require("body-parser"));
const verificationController_1 = require("./controllers/verificationController");
const logger_1 = require("./middlewares/logger");
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.verificationController = new verificationController_1.VerificationController();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.setupGracefulShutdown();
    }
    initializeMiddlewares() {
        // Security
        this.app.use((0, helmet_1.default)());
        // CORS
        this.app.use((0, cors_1.default)({
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(body_parser_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Request logging
        this.app.use((req, res, next) => {
            logger_1.logger.info(`${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);
            next();
        });
    }
    initializeRoutes() {
        // Public API Routes
        this.app.get('/health', this.verificationController.getHealth);
        this.app.post('/api/v1/credentials/verify', this.verificationController.verifyCredential);
        // Admin API Routes (with basic auth in production)
        this.app.get('/admin/metrics', this.verificationController.getMetrics);
        this.app.get('/admin/synced-credentials', this.verificationController.getSyncedCredentials);
        this.app.get('/admin/event-status', this.verificationController.getEventStatus);
        this.app.post('/admin/reprocess-failed', this.verificationController.reprocessFailedEvents);
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                service: 'Kube Credential - Verification Service (Redis Edition)',
                version: '2.0.0',
                status: 'running',
                features: [
                    'Redis Pub/Sub Event Processing',
                    'Automatic Retry Queue',
                    'Dead Letter Queue',
                    'Real-time Metrics',
                    'Admin APIs'
                ],
                endpoints: {
                    public: {
                        health: 'GET /health',
                        verify: 'POST /api/v1/credentials/verify'
                    },
                    admin: {
                        metrics: 'GET /admin/metrics',
                        syncedCredentials: 'GET /admin/synced-credentials?limit=10',
                        eventStatus: 'GET /admin/event-status',
                        reprocessFailed: 'POST /admin/reprocess-failed'
                    }
                }
            });
        });
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint not found',
                path: req.originalUrl
            });
        });
        // Global error handler
        this.app.use((err, req, res, next) => {
            logger_1.logger.error('Unhandled error:', err);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });
    }
    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`📡 Received ${signal}. Starting graceful shutdown...`);
            try {
                // Shutdown the verification controller and its dependencies
                await this.verificationController.shutdown();
                logger_1.logger.info('✅ Graceful shutdown completed');
                process.exit(0);
            }
            catch (error) {
                logger_1.logger.error('❌ Error during graceful shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
}
exports.App = App;
//# sourceMappingURL=app.js.map