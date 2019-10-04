import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { EmailService, ApplicantService } from "../services";
import { Applicant } from "../models/db";
import { RequestUser } from "../util/auth";
import { ApplicantStatus } from "../services/applications/applicantStatus";
import { HttpResponseCode } from "../util/errorHandling";
import { HackathonSettings } from "../models";

export interface IInviteController {
  send: (req: Request, res: Response, next: NextFunction) => void;
  confirm: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for dashboard methods
 */
@injectable()
export class InviteController {
  private _emailService: EmailService;
  private _applicantService: ApplicantService;

  public constructor(
    @inject(TYPES.ApplicantService) applicantService: ApplicantService,
    @inject(TYPES.EmailService) emailService: EmailService
  ) {
    this._applicantService = applicantService;
    this._emailService = emailService;
  }

  public send = async (req: Request, res: Response, next: NextFunction) => {
    const reqUser: RequestUser = (req.user) as RequestUser;
    let applicant: Applicant;
    try {
      applicant = await this._applicantService.findOne(req.params.id, "id");
      if (!applicant) throw new Error("Failed to send invite");
    } catch (err) {
      return res.status(HttpResponseCode.BAD_REQUEST).send({
        message: "Failed to send invite"
      });
    }

    // Check that the chosen user can be invited
    if (applicant.applicationStatus === ApplicantStatus.Applied || applicant.applicationStatus === ApplicantStatus.Reviewed) {
      const subject: string = `[${req.app.locals.settings.shortName}] You've been accepted!`;
      const confirmLink: string = `${req.app.locals.settings.hackathonURL}/invite/${req.params.id}/confirm`;
      const hackathonLogoURL: string = `${req.app.locals.settings.hackathonURL}/img/logo.png`;

      try {
        // Send the email to the user
        const result: boolean = await this._emailService
          .sendEmail(req.app.locals.settings.mainEmail, reqUser.email, subject, "invited", {
            "subject": subject,
            "settings": req.app.locals.settings,
            "confirmLink": confirmLink,
            "hackathonLogoURL": hackathonLogoURL,
            "applicant": {
              "id": applicant.id,
              "name": reqUser.name
            }
          });

        if (result) {
          // Create the accept deadline 5 days in the future
          const acceptDeadline = new Date();
          acceptDeadline.setDate(acceptDeadline.getDate() + 5);
          applicant.inviteAcceptDeadline = acceptDeadline;
          applicant.applicationStatus = ApplicantStatus.Invited;
          await this._applicantService.save(applicant);
        }
      } catch (err) {
        return res.status(HttpResponseCode.BAD_REQUEST).send({
          message: "Failed to send invite"
        });
      }

      return res.send({
        message: "Sent invite successfully!"
      });
    } else {
      return res.send({
        message: "Applicant cannot be invited yet!"
      });
    }
  };

  public confirm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const reqUser: RequestUser = (req.user) as RequestUser;
    let applicant: Applicant;
    try {
      applicant = await this._applicantService.findOne(req.params.id, "id");
      if (!applicant) throw new Error("Failed to confirm attendence, please contact us for help");
    } catch (err) {
      return next(err);
    }

    let notifyMessage: string;
    if (applicant.inviteAcceptDeadline && applicant.inviteAcceptDeadline.getTime() <= new Date().getTime()) {
      // Check that the invite deadline has not expired
      notifyMessage = "This invite has expired, we're sorry you have missed the deadline.";
      applicant.applicationStatus = ApplicantStatus.Rejected;
    } else if (reqUser.auth_id === applicant.authId && applicant.applicationStatus === ApplicantStatus.Invited) {
      // Check that the logged in user can be invited
      notifyMessage = "Thank you! Your attendence has been confirmed!";
      applicant.applicationStatus = ApplicantStatus.Confirmed;
    } else {
      notifyMessage = "An error occured, please try again or contact us for help";
    }

    try {
      await this._applicantService.save(applicant);
    } catch (err) {
      notifyMessage = "An error occured! Please contact us for help";
    }

    res.render("pages/notify", { message: notifyMessage });
  };
}