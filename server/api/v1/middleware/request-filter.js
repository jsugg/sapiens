const express = require('express');
const requestFilterRouter = express.Router();

module.exports = (serverLogger) => {

  // Allowed URI formats and file types
  const allowedFileExtensions = ['3gp', '3gpp', '7z', 'ai', 'aif', 'aiff', 'asf', 'asx', 'atom', 'au', 'avi', 'bin', 'bmp', 'btm', 'cco', 'crt', 'css', 'csv', 'deb', 'der', 'dmg', 'doc', 'docx', 'eot', 'eps', 'flv', 'font', 'gif', 'hqx', 'htc', 'htm', 'html', 'ico', 'img', 'ini', 'iso', 'jad', 'jng', 'jnlp', 'jpeg', 'jpg', 'js', 'json', 'kar', 'kml', 'kmz', 'm3u8', 'm4a', 'm4v', 'map', 'mid', 'midi', 'mml', 'mng', 'mov', 'mp3', 'mp4', 'mpeg', 'mpeg4', 'mpg', 'msi', 'msm', 'msp', 'ogg', 'otf', 'pdb', 'pdf', 'pem', 'pl', 'pm', 'png', 'ppt', 'pptx', 'prc', 'ps', 'psd', 'ra', 'rar', 'rpm', 'rss', 'rtf', 'run', 'sea', 'shtml', 'sit', 'svg', 'svgz', 'swf', 'tar', 'tcl', 'tif', 'tiff', 'tk', 'ts', 'ttf', 'txt', 'wav', 'wbmp', 'webm', 'webp', 'wmf', 'wml', 'wmlc', 'wmv', 'woff', 'woff2', 'xhtml', 'xls', 'xlsx', 'xml', 'xpi', 'xspf', 'zip', 'aifc', 'aac', 'apk', 'bak', 'bk', 'bz2', 'cdr', 'cmx', 'dat', 'dtd', 'eml', 'fla', 'gz', 'gzip', 'ipa', 'ia', 'indd', 'hey', 'lz', 'maf', 'markdown', 'md', 'mkv', 'mp1', 'mp2', 'mpe', 'odt', 'ott', 'odg', 'odf', 'ots', 'pps', 'pot', 'pmd', 'pub', 'raw', 'sdd', 'tsv', 'xcf', 'yml', 'yaml']
  const allowedURIFormatRegex = /(?:http:\/\/)?(?:www\.)?(.*?)\/(.+?)(?:\/|\?|\#|$|\n)/;

  // Validate if the requested URI format is allowed
  function isAllowedURIFormat(url, allowedURIFormatRegex) {
    const allowedURIFormat = new RegExp(allowedURIFormatRegex.toString().slice(1, -1));
    return allowedURIFormat.exec(url);
  }

  // Validate if the requested file-type is allowed
  function isValidFileType(fileExtension, allowedFileExtensions) { 
    return allowedFileExtensions.includes(fileExtension);
  }

  // HTTP(S) request filter
  function loadRequestFilter(app, requestLogger) {
    requestLogger.logger.info('Loading request-filter...');

    requestFilterRouter.use((req, res, next) => {
      requestLogger.startTime = Date.now();
      requestLogger.logger.info('HTTP(S) Request received');
      requestLogger(req, res);

      // Validate the requested URI format
      if (!isAllowedURIFormat(`${req.protocol}://${req.headers.host}${req.originalUrl}`, allowedURIFormatRegex)) { 
        requestLogger.logger.debug({ req, 'message': 'Denying resource - Disallowed URI format' }, '403 FORBIDEN Status response sent');
        res.status(400).send('Bad request. URI format not allowed.'); 
      }
      // Validate if it's a file request for an allowed file type
      else if (req.header('Content-Type') === 'application/octet-stream') {
        if ((fileExtension = req.url.split('.').pop()) && !isValidFileType(fileExtension, allowedFileExtensions)) {
          requestLogger.logger.debug({ req, 'message': 'Denying file-type - Disallowed file extension' }, '403 FORBIDEN Status response sent');
          res.status(403).send('Forbidden. File type not allowed.'); 
        }
      }
      // Redirect from HTTP to HTTPS requests coming from a proxy server
      else if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
        requestLogger.logger.debug({ req, 'message': 'Redirecting from HTTP to HTTPS' }, 'Redirecting Proxy-forwarded request');
        res.redirect(`https://${req.headers.host}${req.url}`);
      }
      // Redirect from HTTP to HTTPS any other request
      else if (!req.headers['x-forwarded-proto'] && req.protocol !== 'https') {
        requestLogger.logger.debug({ req, 'message': 'Redirecting from HTTP to HTTPS' }, 'Redirecting request');
        res.redirect(`https://${req.headers.host}${req.url}`);
      }
      else if (`${req.url}` == '/api/') {
        requestLogger.logger.debug({ req, 'message': 'Redirecting /api to api/v1' }, 'Redirecting request');
        res.redirect(`https://${req.headers.host}${req.url}v1/`);
      }
      // Else
      else { 
        next();
      } 
    });

    requestLogger.logger.info('Request-filter loaded');
  }

  setImmediate(() => { serverLogger.debug('[MODULE] server/request-filter.js loaded') });

  return {
    loadRequestFilter,
    requestFilterRouter
  }
};