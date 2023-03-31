const https = require('https');
const http = require('http');
const express = require('express');
const path = require('node:path');
const appPath = require('app-root-path').toString();
const { logManager, serverLogger } = require(appPath+'/utils/logger.js');
//const containerManager = require(appPath+'/containers/containers.js')(logManager, serverLogger);
const { loadRequestFilter, requestFilterRouter } = require(appPath+'/server/api/v1/middleware/request-filter.js')(serverLogger);
const appRouter = require(appPath+'/server/api/v1/routes/app.js')(serverLogger);
const { webRouter, loadWebRoutes } = require(appPath+'/server/api/v1/routes/web.js')(serverLogger);
const { apiRouter, loadAPIRoutes }  = require(appPath+'/server/api/v1/routes/api.js')(serverLogger);
const authentication = require(appPath+'/server/api/v1/middleware/authentication.js')(serverLogger);
const errorHandler = require(appPath+'/server/api/v1/middleware/error-handler.js')(serverLogger);
const fallbackRouter = express.Router();
const { readFileSync } = require('fs');

// Create the app
const app = express();

// Mount the apiRouter and webRouter on the appRouter
appRouter.use(requestFilterRouter);
appRouter.use('/api', apiRouter);
appRouter.use('/', webRouter);

app.use(appRouter);

/// CONTAINER SUB-SYSTEM
// Start the containers
//containerManager.load();

/// REQUEST MANAGEMENT
const requestLogger = logManager.createLogger({name: 'sapiens:requests'}, 'http');
requestLogger.logger.level = 'trace';
//
// Load the request filter
loadRequestFilter(app, requestLogger);
//
// Load the route manager
loadAPIRoutes(app, requestLogger, appRouter);
//
// Load the route manager
loadWebRoutes(app, requestLogger, appRouter);

app.use(fallbackRouter);

// Main router
appRouter.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    apiRouter(req, res, next);
  } else {
    webRouter(req, res, next);
  }
});

app.use(appRouter);

// HTTP SERVER
// Start the HTTP Server
(async () => {
  serverLogger.info('Starting HTTP Server...');

  // TSL Certificates
  const options = {
    key: readFileSync(`${appPath}/certs/key.pem`),
    cert: readFileSync(`${appPath}/certs/cert.pem`)
  };

  await new Promise((resolve, reject) => {
    try {
      const httpServer = http.createServer(app);
      const httpsServer = https.createServer(options, app);
      
      httpServer.listen(80, () => {
        serverLogger.info('HTTP server listening on port 80');
      });
      
      httpsServer.listen(443, () => {
        serverLogger.info('HTTPS server listening on port 443');
      });
      
      resolve([httpServer, httpsServer]);
    } catch (error) {
      reject(serverLogger.error(error));
    }
  });
  serverLogger.info('HTTP Server started.');
})();


setImmediate(() => { serverLogger.debug('[MODULE] server/index.js object loaded') });