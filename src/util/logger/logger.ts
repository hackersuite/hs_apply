import * as pino from "pino";
import * as pinoHttp from "pino-http";
import * as pinoPrint from "pino-http-print";

const prettyPrint = pinoPrint({
  all: true,
  relativeUrl: true,
  translateTime: "SYS:standard"
})();

const logger = pino(prettyPrint);
const reqLogger = pinoHttp(prettyPrint);

export { logger, reqLogger };
