import { provide } from 'inversify-binding-decorators';
import { Response } from 'request';
import EmailTemplate from 'email-templates';
import sgMail from '@sendgrid/mail';
import { HttpResponseCode } from '../../util/errorHandling';
import { getConfig } from '../../util/config';

export interface EmailServiceInterface {
	sendEmail: (from: string, recipient: string, subject: string, template: string, locals: any) => Promise<boolean>;
}

@provide(EmailService)
export class EmailService implements EmailServiceInterface {
	public sendEmail = async (
		from: string,
		recipient: string,
		subject: string,
		template: string,
		locals: any
	): Promise<boolean> => {
		if (!getConfig().sendgridToken) { throw new Error('Failed to send email via Sendgrid, check sendgrid env settings'); }
		sgMail.setApiKey(getConfig().sendgridToken);

		const msgOptions = {
			from: from,
			to: recipient,
			subject: subject
		};

		const email = new EmailTemplate({
			message: msgOptions,
			views: {
				root: `${__dirname}../../../settings/emailTemplates`,
				options: {
					extension: 'ejs'
				}
			}
		});

		let response: [Response, Record<string, any>];
		try {
			const emailHTML = await email.render(template, locals);
			response = await sgMail.send({ ...msgOptions, html: emailHTML }, false);
		} catch (err) {
			throw new Error('Failed to send email');
		}

		return response[0].statusCode === HttpResponseCode.ACCEPTED;
	};
}
