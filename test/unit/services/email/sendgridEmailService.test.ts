import { setupTestEnvironment, updateEnv } from '../../../util';
setupTestEnvironment();

import { HttpResponseCode } from '../../../../src/util/errorHandling';
import { SendgridEmailService } from '../../../../src/services/mail';
import sgMail from '@sendgrid/mail';

const mockRender = jest.fn().mockImplementation(() => Promise.resolve('<html></html>'));
jest.mock('email-templates', () => jest.fn().mockImplementation(() => ({
	render: mockRender
})));

const mockSend = jest.fn().mockImplementation(() => Promise.resolve(
	[{ statusCode: HttpResponseCode.ACCEPTED }]
));
jest.mock('@sendgrid/mail');

describe('Email service with Sendgrid', () => {
	beforeAll(() => {
		updateEnv({ SENDGRID_API_TOKEN: 'token' });
		(sgMail.send as jest.Mock) = mockSend;
	});

	afterEach(() => {
		mockRender.mockClear();
	});

	test('Test sendgrid sends email with valid config', async () => {
		const emailService = new SendgridEmailService();
		await expect(emailService.sendEmail('', '', '', '', {})).resolves.toBeTruthy();
		expect(mockRender).toBeCalledTimes(1);
	});

	test('Test sendgrid throws error with invalid config', async () => {
		(sgMail.send as jest.Mock) = jest.fn().mockImplementationOnce(() => Promise.reject());

		const emailService = new SendgridEmailService();
		await expect(emailService.sendEmail('', '', '', '', {})).rejects.toBeDefined();
		expect(mockRender).toBeCalledTimes(1);
	});

	test('Test service throws error with empty sendgrid token', async () => {
		updateEnv({ SENDGRID_API_TOKEN: '' });

		const emailService = new SendgridEmailService();
		await expect(emailService.sendEmail('', '', '', '', {})).rejects.toBeDefined();
		expect(mockRender).toBeCalledTimes(0);
	});
});


