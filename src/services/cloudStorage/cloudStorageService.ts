import axios, { ResponseType, AxiosResponse } from 'axios';
import fs from 'fs';
import { provide } from 'inversify-binding-decorators';
import { logger, getSafeUnicode } from '../../util';
import { dropboxAPIFactory, DropboxMethods } from './dropboxAPIFactory';
import { getConfig } from '../../util/config';

export interface CloudStorageServiceInterface {
	upload(fileName: string, file: Buffer): Promise<string>;
	delete(fileName: string): Promise<string>;
	downloadAll(writer: fs.WriteStream): Promise<void>;
}

enum ContentTypeOptions {
	Upload = 'application/octet-stream',
	Request = 'application/json'
}

interface DropboxAPIRequest {
	requestURL: string;
	contentType?: ContentTypeOptions;
	extraHeaders?: any;
	body?: Buffer | any;
	responseType?: ResponseType;
}

@provide(CloudStorageService)
export class CloudStorageService {
	private readonly DROPBOX_BASE_PATH: string;
	private readonly DROPBOX_API_TOKEN?: string;

	public constructor() {
		this.DROPBOX_BASE_PATH = 'hackathon-cv'; // TODO: Add ability to load from config file
		this.DROPBOX_API_TOKEN = getConfig().dropboxToken;

		this.httpHeaderSafeJson = this.httpHeaderSafeJson.bind(this);
		this.upload = this.upload.bind(this);
		this.delete = this.delete.bind(this);
		this.downloadAll = this.downloadAll.bind(this);
	}

	private httpHeaderSafeJson(args: any): string {
		return JSON.stringify(args).replace(/[\u007f-\uffff]/g, getSafeUnicode);
	}

	private async apiRequest(params: DropboxAPIRequest): Promise<AxiosResponse> {
		if (!this.DROPBOX_API_TOKEN || this.DROPBOX_API_TOKEN.length === 0) { throw new Error('Cannot make request to dropbox, Dropbox API token not defined'); }

		// Format the provided headers to be HTTP safe JSON
		if (params.extraHeaders) {
			for (const [key, value] of Object.entries(params.extraHeaders)) {
				params.extraHeaders[key] = this.httpHeaderSafeJson(value);
			}
		}

		// Setup the config, headers and other options
		const config = {
			headers: {
				Authorization: `Bearer ${this.DROPBOX_API_TOKEN}`,
				...(params.contentType && {
					'Content-Type': params.contentType
				}),
				...params.extraHeaders
			},
			...(params.responseType && {
				responseType: params.responseType
			}),
			maxContentLength: 20 * 1024 * 1024 * 1024 // Max 20GB file
		};

		// Make the API request and return raw result
		let result: AxiosResponse;
		try {
			result = await axios.post(params.requestURL, params.body, config);
		} catch (err) {
			logger.error(err);
			throw new Error('Failed to make Dropbox API Request');
		}
		return result;
	}

	public async upload(fileName: string, file: Buffer): Promise<string> {
		const customHeaders = {
			'Dropbox-API-Arg': { path: `/${this.DROPBOX_BASE_PATH}/${fileName}`, mode: 'add', autorename: true, mute: false }
		};

		return (
			await this.apiRequest({
				requestURL: dropboxAPIFactory(DropboxMethods.Upload),
				contentType: ContentTypeOptions.Upload,
				extraHeaders: customHeaders,
				body: file
			})
		).data;
	}

	public async delete(fileName: string): Promise<string> {
		if (!fileName || fileName.length === 0) throw new Error('File name is not valid to delete');
		const requestBody = { path: `/${this.DROPBOX_BASE_PATH}/${fileName}` };

		return (
			await this.apiRequest({
				requestURL: dropboxAPIFactory(DropboxMethods.Delete),
				contentType: ContentTypeOptions.Request,
				body: requestBody
			})
		).data;
	}

	public async downloadAll(writer: fs.WriteStream): Promise<void> {
		const customHeaders = {
			'Dropbox-API-Arg': { path: `/${this.DROPBOX_BASE_PATH}` }
		};

		const response = await this.apiRequest({
			requestURL: dropboxAPIFactory(DropboxMethods.DownloadAll),
			contentType: ContentTypeOptions.Upload,
			extraHeaders: customHeaders,
			responseType: 'stream'
		});

		// Pipe the result of the request to the write stream provided
		(response.data as fs.WriteStream).pipe(writer);
	}
}
