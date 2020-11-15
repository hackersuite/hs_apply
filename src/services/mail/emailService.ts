import { SendgridEmailService, SMTPEmailService } from '../mail';
import { Cache } from '../../util/cache';
import { AppConfig } from '../../settings';
import { HackathonConfig } from '../../models';
import { provide } from 'inversify-binding-decorators';
import { Applicant } from '../../models/db';
import { AuthApi } from '@unicsmcr/hs_auth_client';
import { getConfig } from '../../util/config';

export interface EmailServiceInterface {
	sendEmail(from: string, recipient: string, subject: string, template: string, locals: any): Promise<boolean>;
}

export enum EmailProvider {
	SENDGRID = 'sendgrid',
	SMTP = 'smtp'
}

export enum EmailType {
	INVITE = 'invite',
	REJECT = 'reject',
	DETAILS = 'details',
	FEEDBACK = 'feedback'
}

@provide(EmailService)
export class EmailService {
	private readonly _config: AppConfig;
	private readonly _emailService: EmailServiceInterface;
	private readonly _authApi: AuthApi;

	public constructor(cache: Cache, authApi: AuthApi) {
		this._config = cache.getAll<HackathonConfig>(HackathonConfig.name)[0].config;
		this._authApi = authApi;

		switch (this._config.email.emailProvider) {
			case EmailProvider.SENDGRID:
				this._emailService = new SendgridEmailService();
			case EmailProvider.SMTP:
				this._emailService = new SMTPEmailService();
			default:
				throw new Error(`Invalid email service provider: ${this._config.email.emailProvider as string}`);
		}
	}

	public async sendEmail(recipient: Applicant, emailType: EmailType): Promise<boolean> {
		let authUser;
		try {
			authUser = await this._authApi.getUser(getConfig().hs.serviceToken, recipient.authId!);
		} catch (err) {
			return false;
		}

		let settings;
		switch (emailType) {
			case EmailType.INVITE:
				settings = this.getInviteEmailConfig(recipient, authUser.name);
				break;
			case EmailType.REJECT:
				settings = this.getRejectEmailConfig(recipient, authUser.name);
			case EmailType.DETAILS:
				settings = this.getDetailsEmailConfig(recipient, authUser.name);
				break;
			case EmailType.FEEDBACK:
				settings = this.getFeedbackEmailConfig(recipient, authUser.name);
		}

		const from = `${this._config.shortName} <${this._config.email.mainEmail}>`;
		return this._emailService.sendEmail(from, authUser.email, settings.subject, settings.template, settings.locals);
	}

	private getInviteEmailConfig(applicant: Applicant, applicantName: string) {
		const subject = `[${this._config.shortName}] You've been accepted!`;
		const confirmLink = `${this._config.hackathonURL}/invite/${applicant.id}/confirm`;
		const hackathonLogoURL = `${this._config.hackathonURL}/img/logo.png`;
		return {
			subject: subject,
			template: 'invited',
			locals: {
				subject: subject,
				settings: this._config,
				confirmLink: confirmLink,
				hackathonLogoURL: hackathonLogoURL,
				applicant: {
					id: applicant.id,
					name: applicantName
				}
			}
		};
	}

	private getRejectEmailConfig(applicant: Applicant, applicantName: string) {
		const subject = `[${this._config.shortName}] Application Update`;
		const hackathonLogoURL = `${this._config.hackathonURL}/img/logo.png`;
		return {
			subject: subject,
			template: 'rejected',
			locals: {
				subject: subject,
				settings: this._config,
				hackathonLogoURL: hackathonLogoURL,
				applicant: {
					id: applicant.id,
					name: applicantName
				}
			}
		};
	}

	private getDetailsEmailConfig(applicant: Applicant, applicantName: string) {
		const subject = `[${this._config.shortName}] Important Information`;
		const hackathonLogoURL = `${this._config.hackathonURL}/img/logo.png`;
		return {
			subject: subject,
			template: 'details',
			locals: {
				subject: subject,
				settings: this._config,
				hackathonLogoURL: hackathonLogoURL,
				applicant: {
					id: applicant.id,
					name: applicantName
				}
			}
		};
	}

	private getFeedbackEmailConfig(applicant: Applicant, applicantName: string) {
		const subject = `[${this._config.shortName}] Feedback`;
		const hackathonLogoURL = `${this._config.hackathonURL}/img/logo.png`;
		return {
			subject: subject,
			template: 'feedback',
			locals: {
				subject: subject,
				settings: this._config,
				hackathonLogoURL: hackathonLogoURL,
				applicant: {
					id: applicant.id,
					name: applicantName
				}
			}
		};
	}
}
