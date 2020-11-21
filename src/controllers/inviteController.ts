import { Request, Response, NextFunction } from 'express';
import autoBind from 'auto-bind';
import { provide } from 'inversify-binding-decorators';
import { EmailService, ApplicantService, EmailType } from '../services';
import { Applicant } from '../models/db';
import { ApplicantStatus } from '../services/applications/applicantStatus';
import { HttpResponseCode } from '../util/errorHandling';
import { User } from '@unicsmcr/hs_auth_client';
import { RequestAuthentication } from '../util';
import * as pages from '../views/page';
import { CommonController } from './commonController';

export interface InviteControllerInterface {
	send: (req: Request, res: Response, next: NextFunction) => void;
	confirm: (req: Request, res: Response, next: NextFunction) => void;
}

export enum ConfirmMessageEnum {
	Invalid = 'The invite is on longer valid.',
	Expired = 'This invite has expired, we\'re sorry you have missed the deadline.',
	Confirmed = 'Thank you! Your attendence has been confirmed!',
	Error = 'An error occured, please try again or contact us for help'
}

export enum SendMessageEnum {
	Failed = 'Applicant cannot be invited yet',
	Success = 'Sent invite successfully!',
	Error = 'Failed to send invite'
}

/**
 * A controller for dashboard methods
 */
@provide(InviteController)
export class InviteController extends CommonController implements InviteControllerInterface {
	private readonly _emailService: EmailService;
	private readonly _applicantService: ApplicantService;
	private readonly _requestAuth: RequestAuthentication;

	public constructor(
		applicantService: ApplicantService,
		emailService: EmailService,
		requestAuth: RequestAuthentication
	) {
		super();
		this._applicantService = applicantService;
		this._emailService = emailService;
		this._requestAuth = requestAuth;

		autoBind(this);
	}

	private readonly sendInvite = async (req: Request, applicant: Applicant): Promise<boolean> => {
		if (
			applicant.applicationStatus === ApplicantStatus.Applied ||
      applicant.applicationStatus === ApplicantStatus.Reviewed
		) {
			try {
				// Send the email to the user
				const result: boolean = await this._emailService.sendEmail(applicant, EmailType.INVITE);

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

	private readonly sendReject = async (req: Request, applicant: Applicant): Promise<boolean> => {
		if (
			applicant.applicationStatus === ApplicantStatus.Applied ||
      applicant.applicationStatus === ApplicantStatus.Reviewed
		) {
			try {
				// Send the email to the user
				const result: boolean = await this._emailService.sendEmail(applicant, EmailType.REJECT);

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

	private readonly sendDetails = async (req: Request, applicant: Applicant): Promise<boolean> => {
		if (applicant.applicationStatus === ApplicantStatus.Confirmed) {
			try {
				// Send the email to the user
				const result: boolean = await this._emailService.sendEmail(applicant, EmailType.DETAILS);
				return result;
			} catch (err) {
				return false;
			}
		} else {
			return false;
		}
	};

	private readonly sendFeedback = async (req: Request, applicant: Applicant): Promise<boolean> => {
		if (applicant.applicationStatus === ApplicantStatus.Confirmed) {
			try {
				// Send the email to the user
				const result: boolean = await this._emailService.sendEmail(applicant, EmailType.FEEDBACK);
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
				// const authUser: any = authUsers[applicant.authId!];
				try {
					if (emailType === 'invite') {
						await this.sendInvite(req, applicant);
					} else if (emailType === 'reject') {
						await this.sendReject(req, applicant);
					} else if (emailType === 'details') {
						await this.sendDetails(req, applicant);
					} else if (emailType === 'feedback') {
						await this.sendFeedback(req, applicant);
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
		let applicant: Applicant;
		try {
			applicant = await this._applicantService.findOne(req.params.id, 'id');
		} catch (err) {
			res.status(HttpResponseCode.BAD_REQUEST).send({
				message: SendMessageEnum.Error
			});
			return;
		}

		// Check that the chosen user can be invited
		const result: boolean = await this.sendInvite(req, applicant);
		if (result) {
			res.send({
				message: SendMessageEnum.Success
			});
		} else {
			res.send({
				message: SendMessageEnum.Failed
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
			notifyMessage = ConfirmMessageEnum.Invalid;
		} else if (applicant.inviteAcceptDeadline && applicant.inviteAcceptDeadline.getTime() <= new Date().getTime()) {
			// Check that the invite deadline has not expired
			notifyMessage = ConfirmMessageEnum.Expired;
			applicant.applicationStatus = ApplicantStatus.Rejected;
		} else if (reqUser.id === applicant.authId && applicant.applicationStatus === ApplicantStatus.Invited) {
			// Check that the logged in user can be invited
			notifyMessage = ConfirmMessageEnum.Confirmed;
			applicant.applicationStatus = ApplicantStatus.Confirmed;
		} else {
			notifyMessage = ConfirmMessageEnum.Error;
		}

		try {
			await this._applicantService.save(applicant);
		} catch (err) {
			notifyMessage = ConfirmMessageEnum.Error;
		}

		void super.renderPage(req, res, pages.notify, {
			message: notifyMessage
		});
	}
}
