"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const logger_1 = require("./middlewares/logger");
const startServer = () => {
    const app = new app_1.App();
    const port = process.env.PORT || 3001;
    app.app.listen(port, () => {
        logger_1.logger.info(`🚀 Verification Service (Redis) running on port ${port}`);
        console.log(`\n🔍 Kube Credential - Verification Service (Redis Edition)`);
        console.log(`📡 Server: http://localhost:${port}`);
        console.log(`🔍 Health: http://localhost:${port}/health`);
        console.log(`📋 API: http://localhost:${port}/api/v1/credentials/verify`);
        console.log(`📊 Admin: http://localhost:${port}/admin/metrics`);
        console.log(`\n🚀 Features:`);
        console.log(`  ✅ Redis Pub/Sub Event Subscriber`);
        console.log(`  ✅ Real-time Credential Sync`);
        console.log(`  ✅ Failed Event Recovery`);
        console.log(`  ✅ Comprehensive Admin APIs`);
        console.log(`  ✅ Event Deduplication`);
        console.log(`\n⚡ Ready to verify credentials from Redis events!\n`);
    });
};
startServer();
//# sourceMappingURL=index.js.map