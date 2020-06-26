import fs from 'fs';
import { logger } from '../logger';

export type CleanupCallback = (writeError?: Error) => void;
export type WriteableStreamCallback = (cb: CleanupCallback) => void;

export const createWriteableStream = (fileName: string, callback: WriteableStreamCallback): fs.WriteStream => {
	// Create a writeable stream
	const stream: fs.WriteStream = fs.createWriteStream(fileName);

	// Create the cleanup function that will remove the temp file once sent
	const cleanup: CleanupCallback = (writeError?: Error): void => {
		if (writeError) logger.error(`Encountered an error: ${writeError.message}`);

		fs.unlink(fileName, err => {
			if (err) logger.error(`Failed to remove the ${fileName} file`);
		});
	};

	// Setup some listeners for the finish and error events
	stream
		.on('finish', () => {
			callback(cleanup);
		})
		.on('error', (err: Error) => cleanup(err));

	return stream;
};
