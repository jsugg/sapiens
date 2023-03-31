const appPath = require('app-root-path').toString();
const pino = require('pino')();
const pinoPretty = require('pino-pretty');
const multistream = require('multistream');
const pinoDatadog = require('pino-datadog');
const pinoHttp = require('pino-http');
const { randomUUID } = require('node:crypto')
const path = require('path');
const { createWriteStream } = require('fs');


class LogManager {
  
  LOGS_FOLDER = 'logs';
  #transportSetupFunctions = [];
  #consoleTransport;
  #fileTransport;
  #datadogTransport;
  #logger = pino;

  // Sets the filename of the log file for the module that's using 
  // the logger, and specifies the environment on which the app is 
  // running, and the script that's importing and using the module.
  getLogFilePath() {
    const baseDir = appPath;
    const filename = `[${process.env.NODE_ENV}]-[${path.relative(appPath, __filename).toString().replace('/', ':')}]-[${path.relative(appPath, require.main.filename).toString().replace('/', ':')}].log`;
    return path.join(baseDir, this.LOGS_FOLDER, filename);
  }

  // Transports
  // Console log transport
  #consoleTransportSetup() {
    this.#consoleTransport = pino({
      transport: {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    });
    this.#transportSetupFunctions.push(consoleTransportSetup);
  }

  // Logfile transport
  #fileTransportSetup() {
    this.#fileTransport = pino({
      level: 'debug',
    },
    createWriteStream(this.getLogFilePath()));
    this.#transportSetupFunctions.push(fileTransportSetup);
  };

  // Datadog logs transport
  #datadogTransportSetup() {
    this.datadogTransport = pino.transport({
      level: 'debug',
      options: { colorize: true }
    },
    pinoDatadog({
        apiKey: 'a1a8e3f83e7a3e7686797b6a50894350ef73400a',
        appKey: '3a37a6ea-aa00-40bd-951f-ef3867646183',
        tags: {
          app: 'sapiens',
          env: process.env.NODE_ENV
        }
      })
    );
    this.#transportSetupFunctions.push(datadogTransportSetup);
  } 

  #transportSetup() {
    for (const setup of this.#transportSetupFunctions) { setup() }
  }

  createLogger(loggerConfig, type=null) {
    let streams = [];
    this.#transportSetup();
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'pre-production') {
      streams = [
        {
          level: 'error',
          stream: new multistream([this.#consoleTransport, this.#fileTransport, this.#datadogTransport]),
        },
        {
          level: 'fatal',
          stream: new multistream([this.#consoleTransport, this.#fileTransport, this.#datadogTransport]),
        },
        {
          level: 'warn',
          stream: new multistream([this.#consoleTransport, this.#fileTransport]),
        },
        {
          level: 'info',
          stream: new multistream([this.#consoleTransport, this.#fileTransport]),
        },
        {
          level: 'debug',
          stream: new multistream([this.#consoleTransport, this.#fileTransport, this.#datadogTransport]),
        }
      ];
    } else if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging') {
      streams = [
        {
          level: 'error',
          stream: new multistream([this.#consoleTransport, this.#fileTransport]),
        },
        {
          level: 'fatal',
          stream: new multistream([this.#consoleTransport, this.#fileTransport]),
        },
        {
          level: 'warn',
          stream: new multistream([this.#consoleTransport, this.#fileTransport]),
        },
        {
          level: 'info',
          stream: new multistream([this.#consoleTransport, this.#fileTransport]),
        },
        {
          level: 'debug',
          stream: new multistream([this.#consoleTransport, this.#fileTransport]),
        }
      ];
    }

    switch(type) {
      // Server logger
      case null: 
        this.#logger = pino.child(
          Object.assign(
            {
              level: 'debug',
              streams,
              options: { colorize: true }
            },
          loggerConfig));
        break;
      // HTTP(S) Request logger
      case 'http':
        this.#logger = pinoHttp(
          Object.assign({
            quietReqLogger: true, // turn off the default logging output
            transport: {
              target: 'pino-http-print',
              streams,
              options: {
                destination: 1,
                all: true,
                translateTime: true,
              }
            },
            logger: pino.child({name: loggerConfig.name}),
            genReqId: function (req, res) {
              const existingID = req.id ?? req.headers["x-request-id"];
              if (existingID) return existingID;
              let id = randomUUID();
              res.setHeader('X-Request-Id', id);
              return id;
            },
            serializers: {
              err: pinoHttp.stdSerializers.err,
              req: pinoHttp.stdSerializers.req,
              res: pinoHttp.stdSerializers.res,
              req(req) {
                req.body = req.raw.body;
                return req;
              }
            },
            wrapSerializers: true,
            customLogLevel: function (req, res, err) {
              if (res.statusCode >= 400 && res.statusCode < 500) {
                return 'warn'
              } else if (res.statusCode >= 500 || err) {
                return 'error'
              } else if (res.statusCode >= 300 && res.statusCode < 400) {
                return 'silent'
              }
              return 'info'
            },
            customSuccessMessage: function (req, res) {
              if (res.statusCode === 404) {
                return 'resource not found'
              }
              return `${req.method} completed`
            },
            customReceivedMessage: function (req, res) {
              return 'request received: ' + req.method
            },
            customErrorMessage: function (req, res, err) {
              return 'request errored with status code: ' + res.statusCode
            },
          },
          loggerConfig));
        break;
      default:
    }

    return this.#logger;
  };

  constructor() {}
}

const logManager = new LogManager();
const serverLogger = logManager.createLogger({name: 'sapiens:server'});

setImmediate(() => { serverLogger.debug('[MODULE] utils/logger.js loaded') });

module.exports = {
  serverLogger,
  logManager
};