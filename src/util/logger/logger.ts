import pino from "pino";
import pinoHttp from "pino-http";
import pinoPrint from "pino-http-print";

const prettyPrint = pinoPrint({
  all: true,
  relativeUrl: true,
  translateTime: "SYS:standard"
})();

const logger = pino(prettyPrint);
const reqLogger = pinoHttp(prettyPrint);

export { logger, reqLogger };
