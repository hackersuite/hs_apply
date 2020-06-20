import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { EmailService, ApplicantService } from "../services";
import { Applicant } from "../models/db";
import { ApplicantStatus } from "../services/applications/applicantStatus";
import { HttpResponseCode } from "../util/errorHandling";
import { getUsers, User } from "@unicsmcr/hs_auth_client";

export interface InviteControllerInterface {
  send: (req: Request, res: Response, next: NextFunction) => void;
  confirm: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for dashboard methods
 */
@injectable()
export class InviteController implements InviteControllerInterface {
  private _emailService: EmailService;
  private _applicantService: ApplicantService;

  public constructor(
    @inject(TYPES.ApplicantService) applicantService: ApplicantService,
    @inject(TYPES.EmailService) emailService: EmailService
  ) {
    this._applicantService = applicantService;
    this._emailService = emailService;
  }

  private sendInvite = async (req: Request, applicant: Applicant, name: string, email: string): Promise<boolean> => {
    if (
      applicant.applicationStatus === ApplicantStatus.Applied ||
      applicant.applicationStatus === ApplicantStatus.Reviewed
    ) {
      const subject = `[${req.app.locals.settings.shortName}] You've been accepted!`;
      const confirmLink = `${req.app.locals.settings.hackathonURL}/invite/${applicant.id}/confirm`;
      const hackathonLogoURL = `${req.app.locals.settings.hackathonURL}/img/logo.png`;

      try {
        // Send the email to the user
        const result: boolean = await this._emailService.sendEmail(
          req.app.locals.settings.mainEmail,
          email,
          subject,
          "invited",
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

  private sendReject = async (req: Request, applicant: Applicant, name: string, email: string): Promise<boolean> => {
    if (
      applicant.applicationStatus === ApplicantStatus.Applied ||
      applicant.applicationStatus === ApplicantStatus.Reviewed
    ) {
      const subject = `[${req.app.locals.settings.shortName}] Application Update`;
      const hackathonLogoURL = `${req.app.locals.settings.hackathonURL}/img/logo.png`;

      try {
        // Send the email to the user
        const result: boolean = await this._emailService.sendEmail(
          req.app.locals.settings.mainEmail,
          email,
          subject,
          "rejected",
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

  private sendDetails = async (req: Request, applicant: Applicant, name: string, email: string): Promise<boolean> => {
    if (applicant.applicationStatus === ApplicantStatus.Confirmed) {
      const subject = `[${req.app.locals.settings.shortName}] Important Information`;
      const hackathonLogoURL = `${req.app.locals.settings.hackathonURL}/img/logo.png`;

      try {
        // Send the email to the user
        const result: boolean = await this._emailService.sendEmail(
          `${req.app.locals.settings.shortName} <${req.app.locals.settings.mainEmail}>`,
          email,
          subject,
          "details",
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

  private sendFeedback = async (req: Request, applicant: Applicant, name: string, email: string): Promise<boolean> => {
    if (applicant.applicationStatus === ApplicantStatus.Confirmed) {
      const subject = `[${req.app.locals.settings.shortName}] Feedback`;
      const hackathonLogoURL = `${req.app.locals.settings.hackathonURL}/img/logo.png`;

      try {
        // Send the email to the user
        const result: boolean = await this._emailService.sendEmail(
          `${req.app.locals.settings.shortName} <${req.app.locals.settings.mainEmail}>`,
          email,
          subject,
          "feedback",
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

  public batchSend = async (req: Request, res: Response): Promise<void> => {
    const emailType: string = req.body.emailType;
    const users: string = req.body.users;
    if (!users || !emailType) {
      res.status(HttpResponseCode.BAD_REQUEST).send({
        message: "Failed to send emails"
      });
      return;
    }

    const authUsersResult = await getUsers(req.cookies["Authorization"]);

    // Mapping like in the admin overvire page for ease of use
    const authUsers = {};
    authUsersResult.forEach(a => {
      authUsers[a.id] = { ...a };
    });

    // Send the emails to all the users in the list
    const userIds: Array<string> = users.split("\n");
    const results: Array<any> = await Promise.all(
      userIds.map(async (id: string) => {
        if (!id || id.length === 0) return { status: "rejected", err: "Not defined id" };
        const applicant: Applicant = await this._applicantService.findOne(id);
        const authUser: any = authUsers[applicant.authId];
        let result: boolean;
        try {
          if (emailType === "invite") {
            result = await this.sendInvite(req, applicant, authUser.name, authUser.email);
          } else if (emailType === "reject") {
            result = await this.sendReject(req, applicant, authUser.name, authUser.email);
          } else if (emailType === "details") {
            result = await this.sendDetails(req, applicant, authUser.name, authUser.email);
          } else if (emailType === "feedback") {
            result = await this.sendFeedback(req, applicant, authUser.name, authUser.email);
          }
        } catch (err) {
          return { status: "rejected", err };
        }
        return result ? { status: "fulfilled", id } : { status: "rejected", err: "Failed to send email." };
      })
    );
    res.send(results);
  };

  public send = async (req: Request, res: Response): Promise<void> => {
    const reqUser = req.user as User;

    let applicant: Applicant;
    try {
      applicant = await this._applicantService.findOne(req.params.id, "id");
      if (!applicant) throw new Error("Failed to send invite");
    } catch (err) {
      res.status(HttpResponseCode.BAD_REQUEST).send({
        message: "Failed to send invite"
      });
      return;
    }

    // Check that the chosen user can be invited
    const result: boolean = await this.sendInvite(req, applicant, reqUser.name, reqUser.email);
    if (result) {
      res.send({
        message: "Sent invite successfully!"
      });
    } else {
      res.send({
        message: "Applicant cannot be invited yet!"
      });
    }
  };

  public confirm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const reqUser = req.user as User;
    let applicant: Applicant;
    try {
      applicant = await this._applicantService.findOne(req.params.id, "id");
      if (!applicant) throw new Error("Failed to confirm attendence, please contact us for help");
    } catch (err) {
      return next(err);
    }

    let notifyMessage: string;
    if (applicant.applicationStatus >= ApplicantStatus.Confirmed) {
      notifyMessage = "The invite is on longer valid.";
    } else if (applicant.inviteAcceptDeadline && applicant.inviteAcceptDeadline.getTime() <= new Date().getTime()) {
      // Check that the invite deadline has not expired
      notifyMessage = "This invite has expired, we're sorry you have missed the deadline.";
      applicant.applicationStatus = ApplicantStatus.Rejected;
    } else if (reqUser.id === applicant.authId && applicant.applicationStatus === ApplicantStatus.Invited) {
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
