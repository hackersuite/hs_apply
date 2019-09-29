import { injectable } from "inversify";
import { Response } from "request";
import * as EmailTemplate from "email-templates";
import * as sgMail from "@sendgrid/mail";
import { HttpResponseCode } from "../../util/errorHandling";

export interface IEmailService {
  sendEmail: (from: string, recipient: string, subject: string, template: string, locals: any) => Promise<boolean>;
}

@injectable()
export class EmailService implements IEmailService {

  public sendEmail = async (from: string, recipient: string, subject: string, template: string, locals: any): Promise<boolean> => {
    if (!process.env.SENDGRID_API_KEY)
      throw new Error("Failed to send email via Sendgrid, check sendgrid env settings");

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msgOptions = {
      from: from,
      to: recipient,
      subject: subject
    };

    const email = new EmailTemplate({
      message: msgOptions,
      views: {
        root: __dirname + "../../../settings/emailTemplates",
        options: {
          extension: "ejs"
        }
      }
    });

    let response: [Response, {}];
    try {
      const emailHTML = await email.render(template, locals);
      response = await sgMail.send({...msgOptions, html: emailHTML }, false);
    } catch (err) {
      throw new Error("Failed to send email");
    }

    return response[0].statusCode === HttpResponseCode.ACCEPTED;
  };
}
