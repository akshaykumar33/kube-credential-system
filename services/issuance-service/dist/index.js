"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const logger_1 = require("./middlewares/logger");
const startServer = () => {
    const app = new app_1.App();
    const port = process.env.PORT || 3000;
    app.app.listen(port, () => {
        logger_1.logger.info(`🚀 Issuance Service (Redis) running on port ${port}`);
        console.log(`\n🎓 Kube Credential - Issuance Service (Redis Edition)`);
        console.log(`📡 Server: http://localhost:${port}`);
        console.log(`🔍 Health: http://localhost:${port}/health`);
        console.log(`📋 API: http://localhost:${port}/api/v1/credentials/issue`);
        console.log(`📊 Metrics: http://localhost:${port}/admin/metrics`);
        console.log(`\n🚀 Features:`);
        console.log(`  ✅ Redis Pub/Sub Event Publishing`);
        console.log(`  ✅ Automatic Retry Queue`);
        console.log(`  ✅ Dead Letter Queue`);
        console.log(`  ✅ Exponential Backoff`);
        console.log(`  ✅ Real-time Metrics`);
        console.log(`\n⚡ Ready to issue credentials with Redis events!\n`);
    });
    process.on('SIGTERM', () => {
        logger_1.logger.info('SIGTERM received, shutting down gracefully');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        logger_1.logger.info('SIGINT received, shutting down gracefully');
        process.exit(0);
    });
};
startServer();
//# sourceMappingURL=index.js.map