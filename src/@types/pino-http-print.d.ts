declare module 'pino-http-print' {
	interface HttpPrintOptions {
		all: boolean;
		colorize: boolean;
		translateTime: boolean|string;
		relativeUrl: boolean;
	}

	export default (options?: Partial<HttpPrintOptions>, prettyOptions?: Record<string, any>) => () => any;
}
