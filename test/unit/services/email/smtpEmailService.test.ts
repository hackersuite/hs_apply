import { setupTestEnvironment, updateEnv } from '../../../util';
setupTestEnvironment();

import { HttpResponseCode } from '../../../../src/util/errorHandling';
import { SMTPEmailService } from '../../../../src/services/mail';
import * as nodemailer from 'nodemailer';

const mockRender = jest.fn().mockImplementation(() => Promise.resolve('<html></html>'));
jest.mock('email-templates', () => jest.fn().mockImplementation(() => ({
	render: mockRender
})));

const mockSend = jest.fn().mockImplementation(() => Promise.resolve(
	[{ statusCode: HttpResponseCode.ACCEPTED }]
));
jest.mock('nodemailer');

describe('Email service with SMTP', () => {
	beforeAll(() => {
		updateEnv({ SMTP_USERNAME: '', SMTP_PASSWORD: '', SMTP_HOST: '', SMTP_PORT: '0' });
		(nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: mockSend });
	});

	afterEach(() => {
		mockRender.mockClear();
		mockSend.mockClear();
	});

	test('Test smtp sends email with valid config', async () => {
		const emailService = new SMTPEmailService();
		await expect(emailService.sendEmail('', '', '', '', {})).resolves.toBeTruthy();
		expect(mockRender).toBeCalledTimes(1);
		expect(mockSend).toBeCalledTimes(1);
	});

	test('Test smtp throws error with invalid config', async () => {
		const mockSendRejects = jest.fn().mockImplementationOnce(() => Promise.reject());
		(nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: mockSendRejects });

		const emailService = new SMTPEmailService();
		await expect(emailService.sendEmail('', '', '', '', {})).rejects.toBeDefined();
		expect(mockRender).toBeCalledTimes(1);
		expect(mockSendRejects).toBeCalledTimes(1);
	});
});


