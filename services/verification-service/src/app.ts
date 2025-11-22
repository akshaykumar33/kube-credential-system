import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import  bodyParser from 'body-parser';
import { VerificationController } from './controllers/verificationController';
import { logger } from './middlewares/logger';

export class App {
  public app: express.Application;
  private verificationController: VerificationController;

  constructor() {
    this.app = express();
    this.verificationController = new VerificationController();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.setupGracefulShutdown();
  }

  private initializeMiddlewares(): void {
    // Security
    this.app.use(helmet());

    // CORS
    this.app.use(cors({ 
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(bodyParser.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);
      next();
    });
  }

  private initializeRoutes(): void {
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
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
  }

  public setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`📡 Received ${signal}. Starting graceful shutdown...`);

      try {
        // Shutdown the verification controller and its dependencies
        await this.verificationController.shutdown();

        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
}