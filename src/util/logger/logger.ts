import pino from 'pino';
import pinoHttp from 'pino-http';

const logger = pino();
const reqLogger = pinoHttp();

export { logger, reqLogger };
