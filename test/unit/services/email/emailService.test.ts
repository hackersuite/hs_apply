import { setupTestEnvironment } from '../../../util';
setupTestEnvironment();
import { mockHackathonConfigCache } from '../../../util/mocks';

import { EmailService, EmailProvider, EmailType } from '../../../../src/services';
import { User } from '@unicsmcr/hs_auth_client';
import { Cache } from '../../../../src/util/cache';

import container from '../../../../src/inversify.config';
import { instance } from 'ts-mockito';
import { SendgridEmailService, SMTPEmailService } from '../../../../src/services/mail';
import { Applicant } from '../../../../src/models/db';

let mockCache: Cache;
let emailService: EmailService;

const requestUser: User = {
	name: 'Test',
	email: 'test@test.com',
	id: '010101'
};
const testApplicant: Applicant = new Applicant();
testApplicant.authId = requestUser.id;

beforeEach(() => {
	// Create a snapshot so each unit test can modify it without breaking other unit tests
	container.snapshot();
});

afterEach(() => {
	// Restore to last snapshot so each unit test takes a clean copy of the container
	container.restore();
});

const mockGetUser = jest.fn().mockImplementation(() => Promise.resolve(requestUser));
jest.mock('@unicsmcr/hs_auth_client', () => ({
	AuthApi: jest.fn().mockImplementation(() => ({ getUser: mockGetUser }))
}));

describe('Email service with Sendgrid', () => {
	beforeEach(() => {
		mockCache = mockHackathonConfigCache();
		container.rebind(Cache).toConstantValue(instance(mockCache));

		emailService = container.get(EmailService);
	});

	afterEach(() => {
		mockGetUser.mockClear();
	});

	test('Test email service configured with Sendgrid service', () => {
		expect((emailService as any)._emailService).toBeInstanceOf(SendgridEmailService);
	});

	test('Test invite email composed', async () => {
		// Mock the underlying email send method
		(emailService as any)._emailService.sendEmail = jest.fn(() => Promise.resolve(true));

		await expect(emailService.sendEmail(testApplicant, EmailType.INVITE)).resolves.toBeTruthy();
		expect(mockGetUser).toBeCalledTimes(1);
	});

	test('Test reject email composed', async () => {
		// Mock the underlying email send method
		(emailService as any)._emailService.sendEmail = jest.fn(() => Promise.resolve(true));

		await expect(emailService.sendEmail(testApplicant, EmailType.REJECT)).resolves.toBeTruthy();
		expect(mockGetUser).toBeCalledTimes(1);
	});

	test('Test details email composed', async () => {
		// Mock the underlying email send method
		(emailService as any)._emailService.sendEmail = jest.fn(() => Promise.resolve(true));

		await expect(emailService.sendEmail(testApplicant, EmailType.DETAILS)).resolves.toBeTruthy();
		expect(mockGetUser).toBeCalledTimes(1);
	});

	test('Test feedback email composed', async () => {
		// Mock the underlying email send method
		(emailService as any)._emailService.sendEmail = jest.fn(() => Promise.resolve(true));

		await expect(emailService.sendEmail(testApplicant, EmailType.FEEDBACK)).resolves.toBeTruthy();
		expect(mockGetUser).toBeCalledTimes(1);
	});
});

describe('Email service with SMTP', () => {
	beforeEach(() => {
		mockCache = mockHackathonConfigCache({ email: { emailProvider: EmailProvider.SMTP } });
		container.rebind(Cache).toConstantValue(instance(mockCache));

		emailService = container.get(EmailService);
	});

	test('Test email service configured with Sendgrid service', () => {
		expect((emailService as any)._emailService).toBeInstanceOf(SMTPEmailService);
	});
});

describe('Email service with errors', () => {
	test('Test error thrown when invalid email service provided', () => {
		expect.assertions(1);

		mockCache = mockHackathonConfigCache({ email: { emailProvider: 'invalidtest' as EmailProvider } });
		container.rebind(Cache).toConstantValue(instance(mockCache));

		try {
			emailService = container.get(EmailService);
		} catch (err) {
			expect(err).toBeDefined();
		}
	});

	test('Test error thrown when auth api throws error', async () => {
		mockCache = mockHackathonConfigCache();
		container.rebind(Cache).toConstantValue(instance(mockCache));
		emailService = container.get(EmailService);
		mockGetUser.mockImplementationOnce(() => Promise.reject());

		await expect(emailService.sendEmail(testApplicant, EmailType.INVITE)).rejects.toBeDefined();
	});
});


