import * as passport from "passport";
import * as request from "request-promise-native";
import * as querystring from "querystring";
import { Express, Request, Response, Application, NextFunction, CookieOptions } from "express";
import { HttpResponseCode } from "../errorHandling";
import * as CookieStrategy from "passport-cookie";
import { AuthLevels } from "./authLevels";
import { injectable, inject } from "inversify";
import { ApplicantService } from "../../services";
import { TYPES } from "../../types";
import { Cache } from "../cache";

export interface RequestAuthenticationInterface {
  passportSetup: (app: Application) => void;
}

export type RequestUser = {
  authId: string;
  authLevel: number;
  name: string;
  email: string;
  team: string;
};

@injectable()
export class RequestAuthentication {
  // We inject the applicant service since in the future we may want to
  // get check if a partial application has been added to the database
  // and attach it to req.user
  private _applicantService: ApplicantService;

  private _cache: Cache;

  public constructor(
    @inject(TYPES.Cache) cache: Cache,
    @inject(TYPES.ApplicantService) applicantService: ApplicantService
  ) {
    this._applicantService = applicantService;
    this._cache = cache;
  }

  private logout = (app: Express): void => {
    let logoutCookieOptions: CookieOptions = undefined;
    if (app.get("env") === "production") {
      logoutCookieOptions = {
        domain: app.locals.settings.rootDomain,
        secure: true,
        httpOnly: true
      };
    }

    app.get("/logout", function(req: Request, res: Response) {
      res.cookie("Authorization", "", logoutCookieOptions);
      return res.redirect("/");
    });
  };

  public passportSetup = (app: Express): void => {
    this.logout(app);

    app.use(passport.initialize());
    passport.use(
      new CookieStrategy(
        {
          cookieName: "Authorization",
          passReqToCallback: true
        },
        async (req: Request, token: string, done: (error: string, user?: any) => void): Promise<void> => {
          let apiResult: string;
          try {
            apiResult = await request.get(`${process.env.AUTH_URL}/api/v1/users/me`, {
              headers: {
                Authorization: `${token}`,
                Referer: req.originalUrl
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
          } else if (result.status === 0) {
            // The request has been authorized

            (req.user as RequestUser) = {
              authId: result.user._id,
              authLevel: result.user.auth_level,
              name: result.user.name,
              email: result.user.email,
              team: result.user.team
            };
            return done(undefined, req.user);
          }
        }
      )
    );
  };

  public checkLoggedIn = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate(
      "cookie",
      {
        session: false
      },
      (err, user, info) => {
        if (err) {
          return next(err);
        }

        // There is not authenticated user, so redirect to logins
        if (!user) {
          const queryParam: string = querystring.encode({
            returnto: `${process.env.APPLICATION_URL}${req.originalUrl}`
          });
          res.redirect(`${process.env.AUTH_URL}/login?${queryParam}`);
          return;
        }
        res.locals.authLevel = user.authLevel;
        return next();
      }
    )(req, res, next);
  };

  public checkAuthLevel = (req: Request, res: Response, user: RequestUser, requiredAuth: AuthLevels): boolean => {
    if (!user || user.authLevel < requiredAuth) {
      const queryParam: string = querystring.encode({ returnto: `${process.env.APPLICATION_URL}${req.originalUrl}` });
      res.redirect(`${process.env.AUTH_URL}/login?${queryParam}`);
      return;
    }
    return true;
  };

  public checkIsAttendee = (req: Request, res: Response, next: NextFunction): void => {
    if (this.checkAuthLevel(req, res, req.user as RequestUser, AuthLevels.Attendee)) {
      res.locals.isAttendee = true;
      return next();
    }
  };

  public checkIsVolunteer = (req: Request, res: Response, next: NextFunction): void => {
    if (this.checkAuthLevel(req, res, req.user as RequestUser, AuthLevels.Volunteer)) {
      res.locals.isVolunteer = true;
      return next();
    }
  };

  public checkIsOrganizer = (req: Request, res: Response, next: NextFunction): void => {
    if (this.checkAuthLevel(req, res, req.user as RequestUser, AuthLevels.Organizer)) {
      res.locals.isOrganizer = true;
      res.locals.isVolunteer = true;
      return next();
    }
  };
}
