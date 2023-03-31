const express = require('express');
const apiRouter = express.Router();
const appPath = require('app-root-path').toString();
const WebScrapper = require(appPath+'/utils/webscrapper.js');
const cors =  require('cors');

module.exports = (serverLogger) => {

  function loadAPIRoutes(app, requestLogger) {
    requestLogger.logger.info('Loading APIRoutes...');

    // Ping route
    apiRouter.get(['/ping', '/v1/ping'], (req, res) => {
      requestLogger.startTime = Date.now();
      requestLogger.logger.info(`${requestLogger.startTime} Request received`);
      requestLogger(req, res);
      res.status(200).send('pong');
    });

    apiRouter.get(['/webScrapper/images', '/v1/webScrapper/images'], cors(), async (req, res) => {
      requestLogger.startTime = Date.now();
      requestLogger.logger.info(`${requestLogger.startTime} Request received`);
      requestLogger(req, res);
      
      const requestUrl = req.query.url;
    
      if (!requestUrl) {
        res.status(400).json({ error: 'Missing required query parameter: url' });
        return;
      }
    
      try {
        const images = await WebScrapper.getImages(requestUrl);
        res.json(images);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching images from the provided URL' });
      }
    });

    // API 404 error handling
    apiRouter.use((req, res, next) => {
      res.status(404).json({ error: 'Endpoint not found' });
      next();
    });

    requestLogger.logger.info('APIRoutes loaded.');
  }

  setImmediate(() => { serverLogger.debug('[MODULE] server/routes/api.js loaded'); });

  // Module exports
  return {
    loadAPIRoutes,
    apiRouter
  };
};