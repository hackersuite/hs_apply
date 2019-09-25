import * as passport from "passport";
import * as request from "request-promise-native";
import * as querystring from "querystring";
import { Request, Response, Application, NextFunction } from "express";
import { HttpResponseCode } from "../errorHandling";
import * as CookieStrategy from "passport-cookie";
import { AuthLevels } from "./authLevels";
import { injectable, inject } from "inversify";
import { ApplicantService } from "../../services";
import { TYPES } from "../../types";

export interface IRequestAuthentication {
  passportSetup: (app: Application) => void;
}

export type RequestUser = {
  auth_id: string,
  auth_level: number
};

@injectable()
export class RequestAuthentication {
  // We inject the applicant service since in the future we may want to
  // get check if a partial application has been added to the database
  // and attach it to req.user
  private _applicantService: ApplicantService;

  public constructor(
    @inject(TYPES.ApplicantService) applicantService: ApplicantService
  ) {
    this._applicantService = applicantService;
  }

  public passportSetup = (app: Application) => {
    app.use(passport.initialize());
    passport.use(new CookieStrategy({
      cookieName: "Authorization",
      passReqToCallback: true
    }, async (req: Request, token: string, done: (error: any, user?: any) => void): Promise<any> => {

      let apiResult: string;
      try {
        apiResult = await request
          .get(`http://localhost:8000/api/v1/users/verify`, {
            headers: {
              "Authorization": `${token}`,
              "Referer": req.originalUrl
            }
        });
      } catch (err) {
        // Some internal error has occured
        return done(err);
      }
      // We expect the result to be returned as JSON, parse it
      const result = JSON.parse(apiResult);
      if (result.error && result.status === HttpResponseCode.UNAUTHORIZED) {
        // When there is an error message and the status code is 401
        return done(undefined, false);
      } else if (result.status === HttpResponseCode.OK) {
        // The request has been authorized
        // TODO: Load the applicant from the database into req.user
        // The problems is that if they haven't created an application they wont be in the database
        // We only have the auth_id to find the user in the db. We could create a new entry
        // but since we use class validation for applications it will always fail right now
        req.user = {
          "auth_id": result.user_id,
          "auth_level": result.auth_level
        };
        return done(undefined, req.user);
      }
    }));
  };
}

export const checkLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("cookie", { session: false }, (err, user, info) => {
    if (err) { return next(err); }

    // There is no authenticated user, so redirect to logins
    if (!user) {
      const queryParam: string = querystring.encode({"returnto": "http://localhost:8010/apply"});
      return res.redirect(`http://localhost:8000/login?${queryParam}`);
    }

    return next();
  })(req, res, next);
};

export const checkIsAttendee = (req: Request, res: Response, next: NextFunction) => {
  if (checkAuthLevel(req, res, req.user as RequestUser, AuthLevels.Attendee)) {
    res.locals.isAttendee = true;
    return next();
  }
};

export const checkIsOrganizer = (req: Request, res: Response, next: NextFunction) => {
  if (checkAuthLevel(req, res, req.user as RequestUser, AuthLevels.Organizer)) {
    res.locals.isOrganizer = true;
    return next();
  }
};

const checkAuthLevel = (req: Request, res: Response, user: RequestUser, requiredAuth: AuthLevels): boolean => {
  if (!user || user.auth_level < requiredAuth) {
    const queryParam: string = querystring.encode({"returnto": `${process.env.APPLICATION_URL}${req.originalUrl}`});
    res.redirect(`${process.env.AUTH_URL}/login?${queryParam}`);
    return false;
  }
  return true;
};