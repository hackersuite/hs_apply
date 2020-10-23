import { Request, Response, NextFunction } from 'express';
import autoBind from 'auto-bind';
import { provide } from 'inversify-binding-decorators';
import { EmailService, ApplicantService } from '../services';
import { Applicant } from '../models/db';
import { ApplicantStatus } from '../services/applications/applicantStatus';
import { HttpResponseCode } from '../util/errorHandling';
import { User } from '@unicsmcr/hs_auth_client';
import { HackathonSettingsInterface } from '../settings';
import { RequestAuthentication } from '../util';

export interface InviteControllerInterface {
	send: (req: Request, res: Response, next: NextFunction) => void;
	confirm: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for dashboard methods
 */
@provide(InviteController)
export class InviteController implements InviteControllerInterface {
	private readonly _emailService: EmailService;
	private readonly _applicantService: ApplicantService;
	private readonly _requestAuth: RequestAuthentication;

	public constructor(
		applicantService: ApplicantService,
		emailService: EmailService,
		requestAuth: RequestAuthentication
	) {
		this._applicantService = applicantService;
		this._emailService = emailService;
		this._requestAuth = requestAuth;

		autoBind(this);
	}

	private readonly sendInvite = async (req: Request, applicant: Applicant, name: string, email: string): Promise<boolean> => {
		if (
			applicant.applicationStatus === ApplicantStatus.Applied ||
      applicant.applicationStatus === ApplicantStatus.Reviewed
		) {
			const settings = req.app.locals.settings as HackathonSettingsInterface;
			const subject = `[${settings.shortName}] You've been accepted!`;
			const confirmLink = `${settings.hackathonURL}/invite/${applicant.id}/confirm`;
			const hackathonLogoURL = `${settings.hackathonURL}/img/logo.png`;

			try {
				// Send the email to the user
				const result: boolean = await this._emailService.sendEmail(
					req.app.locals.settings.mainEmail,
					email,
					subject,
					'invited',
					{
						subject: subject,
						settings: req.app.locals.settings,
						confirmLink: confirmLink,
						hackathonLogoURL: hackathonLogoURL,
						applicant: {
							id: applicant.id,
							name: name
						}
					}
				);

				if (result) {
					// Create the accept deadline 5 days in the future
					const acceptDeadline = new Date();
					acceptDeadline.setDate(acceptDeadline.getDate() + 5);
					await this._applicantService.save({
						...applicant,
						inviteAcceptDeadline: acceptDeadline,
						applicationStatus: ApplicantStatus.Invited
					});
				}
				return result;
			} catch (err) {
				return false;
			}
		} else {
			return false;
		}
	};

	private readonly sendReject = async (req: Request, applicant: Applicant, name: string, email: string): Promise<boolean> => {
		if (
			applicant.applicationStatus === ApplicantStatus.Applied ||
      applicant.applicationStatus === ApplicantStatus.Reviewed
		) {
			const settings = req.app.locals.settings as HackathonSettingsInterface;
			const subject = `[${settings.shortName}] Application Update`;
			const hackathonLogoURL = `${settings.hackathonURL}/img/logo.png`;

			try {
				// Send the email to the user
				const result: boolean = await this._emailService.sendEmail(
					req.app.locals.settings.mainEmail,
					email,
					subject,
					'rejected',
					{
						subject: subject,
						settings: req.app.locals.settings,
						hackathonLogoURL: hackathonLogoURL,
						applicant: {
							id: applicant.id,
							name: name
						}
					}
				);

				if (result) {
					// Set the applicant state to be rejected
					await this._applicantService.save({
						...applicant,
						applicationStatus: ApplicantStatus.Rejected
					});
				}
				return result;
			} catch (err) {
				return false;
			}
		} else {
			return false;
		}
	};

	private readonly sendDetails = async (req: Request, applicant: Applicant, name: string, email: string): Promise<boolean> => {
		if (applicant.applicationStatus === ApplicantStatus.Confirmed) {
			const settings = req.app.locals.settings as HackathonSettingsInterface;
			const subject = `[${settings.shortName}] Important Information`;
			const hackathonLogoURL = `${settings.hackathonURL}/img/logo.png`;

			try {
				// Send the email to the user
				const result: boolean = await this._emailService.sendEmail(
					`${settings.shortName} <${settings.mainEmail}>`,
					email,
					subject,
					'details',
					{
						subject: subject,
						settings: req.app.locals.settings,
						hackathonLogoURL: hackathonLogoURL,
						applicant: {
							id: applicant.id,
							name: name
						}
					}
				);
				return result;
			} catch (err) {
				return false;
			}
		} else {
			return false;
		}
	};

	private readonly sendFeedback = async (req: Request, applicant: Applicant, name: string, email: string): Promise<boolean> => {
		if (applicant.applicationStatus === ApplicantStatus.Confirmed) {
			const settings = req.app.locals.settings as HackathonSettingsInterface;
			const subject = `[${settings.shortName}] Feedback`;
			const hackathonLogoURL = `${settings.hackathonURL}/img/logo.png`;

			try {
				// Send the email to the user
				const result: boolean = await this._emailService.sendEmail(
					`${settings.shortName} <${settings.mainEmail}>`,
					email,
					subject,
					'feedback',
					{
						subject: subject,
						settings: req.app.locals.settings,
						hackathonLogoURL: hackathonLogoURL,
						applicant: {
							id: applicant.id,
							name: name
						}
					}
				);
				return result;
			} catch (err) {
				return false;
			}
		} else {
			return false;
		}
	};

	public async batchSend(req: Request, res: Response): Promise<void> {
		const emailType: string = req.body.emailType;
		const users: string = req.body.users;
		if (!users || !emailType) {
			res.status(HttpResponseCode.BAD_REQUEST).send({
				message: 'Failed to send emails'
			});
			return;
		}

		const authUsersResult = await this._requestAuth.authApi.getUsers(this._requestAuth.getUserAuthToken(req));

		// Mapping like in the admin overvire page for ease of use
		const authUsers: Record<string, User> = {};
		authUsersResult.forEach(a => {
			authUsers[a.id] = { ...a };
		});

		// Send the emails to all the users in the list
		const userIds: Array<string> = users.split('\n');
		const results: Array<any> = await Promise.all(
			userIds.map(async (id: string) => {
				if (!id || id.length === 0) return { status: 'rejected', err: 'Not defined id' };
				const applicant: Applicant = await this._applicantService.findOne(id);
				const authUser: any = authUsers[applicant.authId!];
				try {
					if (emailType === 'invite') {
						await this.sendInvite(req, applicant, authUser.name, authUser.email);
					} else if (emailType === 'reject') {
						await this.sendReject(req, applicant, authUser.name, authUser.email);
					} else if (emailType === 'details') {
						await this.sendDetails(req, applicant, authUser.name, authUser.email);
					} else if (emailType === 'feedback') {
						await this.sendFeedback(req, applicant, authUser.name, authUser.email);
					}
				} catch (err) {
					return { status: 'rejected', err: 'Failed to send email.' };
				}
				return { status: 'fulfilled', id };
			})
		);
		res.send(results);
	}

	public async send(req: Request, res: Response): Promise<void> {
		const reqUser = req.user as User;

		let applicant: Applicant;
		try {
			applicant = await this._applicantService.findOne(req.params.id, 'id');
		} catch (err) {
			res.status(HttpResponseCode.BAD_REQUEST).send({
				message: 'Failed to send invite'
			});
			return;
		}

		// Check that the chosen user can be invited
		const result: boolean = await this.sendInvite(req, applicant, reqUser.name, reqUser.email);
		if (result) {
			res.send({
				message: 'Sent invite successfully!'
			});
		} else {
			res.send({
				message: 'Applicant cannot be invited yet!'
			});
		}
	}

	public async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
		const reqUser = req.user as User;
		let applicant: Applicant;
		try {
			applicant = await this._applicantService.findOne(req.params.id, 'id');
		} catch (err) {
			return next(new Error('Failed to confirm attendence, please contact us for help'));
		}

		let notifyMessage: string;
		if (applicant.applicationStatus >= ApplicantStatus.Confirmed) {
			notifyMessage = 'The invite is on longer valid.';
		} else if (applicant.inviteAcceptDeadline && applicant.inviteAcceptDeadline.getTime() <= new Date().getTime()) {
			// Check that the invite deadline has not expired
			notifyMessage = "This invite has expired, we're sorry you have missed the deadline.";
			applicant.applicationStatus = ApplicantStatus.Rejected;
		} else if (reqUser.id === applicant.authId && applicant.applicationStatus === ApplicantStatus.Invited) {
			// Check that the logged in user can be invited
			notifyMessage = 'Thank you! Your attendence has been confirmed!';
			applicant.applicationStatus = ApplicantStatus.Confirmed;
		} else {
			notifyMessage = 'An error occured, please try again or contact us for help';
		}

		try {
			await this._applicantService.save(applicant);
		} catch (err) {
			notifyMessage = 'An error occured! Please contact us for help';
		}

		res.render('pages/notify', { message: notifyMessage });
	}
}
