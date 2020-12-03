import { setupTestEnvironment } from '../../util';
setupTestEnvironment();
import { setupCommonMocks } from '../../util/mocks';
setupCommonMocks();

import { CloudStorageService } from '../../../src/services';
import axios from 'axios';
import { createWriteStream as writeStreamFunc } from 'fs';
import { PassThrough } from 'stream';

import container from '../../../src/inversify.config';

let storageService: CloudStorageService;

const failResponseAPIErr = new Error('Failed to make Dropbox API Request');
const failResponseServiceErr = new Error('File name is not valid to delete');

beforeEach(() => {
	// Create a snapshot so each unit test can modify it without breaking other unit tests
	container.snapshot();
	storageService = container.get(CloudStorageService);
});

afterEach(() => {
	// Restore to last snapshot so each unit test takes a clean copy of the container
	container.restore();
});

jest.mock('axios');
describe('API request to dropbox', () => {
	const axiosMock = axios as jest.Mocked<typeof axios>;
	const successResponse = 'Success';
	beforeAll(() => {
		axiosMock.post.mockResolvedValue({ data: successResponse });
	});

	afterEach(() => {
		axiosMock.post.mockClear();
	});

	test('Test upload should return success with valid file buffer', async () => {
		const result = await storageService.upload('testfile.pdf', Buffer.from(''));

		expect(axiosMock.post).toBeCalledTimes(1);
		expect(result).toBe(successResponse);
	});

	test('Test delete should return success with valid filename', async () => {
		const result = await storageService.delete('testfile.pdf');

		expect(axiosMock.post).toBeCalledTimes(1);
		expect(result).toBe(successResponse);
	});

	jest.mock('fs');
	const mockCreateWriteStreamFunction = writeStreamFunc as jest.Mock;
	test.skip('Test downloadAll should return success with write stream', async () => {
		const mockStream = new PassThrough();
		mockCreateWriteStreamFunction.mockImplementation(() => mockStream);
		const mockWriteStream = mockCreateWriteStreamFunction('temp.pdf');

		const result = await storageService.downloadAll(mockWriteStream);

		expect(axiosMock.post).toBeCalledTimes(1);
		expect(result).toBe(successResponse);
	});
});

describe('Invalid API requests to dropbox', () => {
	const axiosMock = axios as jest.Mocked<typeof axios>;
	const failResponse = { data: 'Failed' };
	beforeAll(() => {
		axiosMock.post.mockRejectedValue(failResponse);
	});

	afterEach(() => {
		axiosMock.post.mockClear();
	});

	test('Test upload should fail when upload API request fails', async () => {
		const promiseResult = storageService.upload('testfile.pdf', Buffer.from(''));
		await expect(promiseResult).rejects.toThrow(failResponseAPIErr);
	});

	test('Test delete should fail when upload API request fails', async () => {
		const promiseResult = storageService.delete('testfile.pdf');
		await expect(promiseResult).rejects.toThrow(failResponseAPIErr);
	});

	test('Test delete should fail when invalid filename provided', async () => {
		const promiseResult = storageService.delete('');
		await expect(promiseResult).rejects.toThrow(failResponseServiceErr);
	});
});
