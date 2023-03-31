const express = require('express');
const appPath = require('app-root-path').toString();
const path = require('node:path');
const webRouter = express.Router();
const { readFileSync } = require('fs');

module.exports = (serverLogger) => {

  function loadWebRoutes(app, requestLogger) {
    requestLogger.logger.info('Loading webRoutes...');
    
    webRouter.use(express.static(path.join(appPath, 'public')));

    webRouter.get('/', (req, res) => {
      res.sendFile(readFileSync(path.join(appPath, 'public', 'index.html'), 'utf8'));
    });

    webRouter.get('/carrousel', (req, res) => {
      res.sendFile(path.join(appPath, 'public/carrousel', 'index.html'));
    });

    webRouter.get('/describe-images', (req, res) => {
      res.sendFile(path.join(appPath, 'public/describe_images', 'index.html'));
    });

    // Configure static content 404 fallback page
    webRouter.use((req, res, next) => {
      res.status(404).sendFile(path.join(appPath, 'public', 'fallback', '404.html'));
    });

    webRouter.use((req, res, next) => {
      res.status(500).sendFile(path.join(appPath, 'public', 'fallback', '500.html'));
    });

    requestLogger.logger.info('WebRoutes loaded.');
  }

  setImmediate(() => { serverLogger.debug('[MODULE] server/routes/web.js loaded'); });

  // Module exports
  return {
    loadWebRoutes,
    webRouter
  };
};