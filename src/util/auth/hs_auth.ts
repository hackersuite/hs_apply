import passport from "passport";
import querystring from "querystring";
import { Express, Request, Response, Application, NextFunction, CookieOptions } from "express";
import CookieStrategy from "passport-cookie";
import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { Cache } from "../cache";
import { getCurrentUser, User, AuthLevel } from "@unicsmcr/hs_auth_client";

export interface RequestAuthenticationInterface {
  passportSetup: (app: Application) => void;
}

@injectable()
export class RequestAuthentication {
  private _cache: Cache;

  public constructor(@inject(TYPES.Cache) cache: Cache) {
    this._cache = cache;
  }

  private logout = (app: Express): void => {
    let logoutCookieOptions: CookieOptions;
    if (app.get("env") === "production") {
      logoutCookieOptions = {
        domain: app.locals.settings.rootDomain,
        secure: true,
        httpOnly: true
      };
    }

    // When the user logs out we clear the authorization cookie and redirect
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
        // Defines the callback function which is executed after the cookie strategy is completed
        // We call the API endpoint on hs_auth to return the user based on the token
        async (req: Request, token: string, done: (error?: string, user?: any) => void): Promise<void> => {
          let apiResult: User;
          try {
            apiResult = await getCurrentUser(token, req.originalUrl);
          } catch (err) {
            return done(undefined, false);
          }

          req.user = apiResult;
          return done(undefined, apiResult);
        }
      )
    );
  };

  /**
   * Authennticate function used to authenticate the current request
   * Uses the token in the `Authorization` cookie, if it doesn't exist then the promise is rejected
   * Calls the function defined above in `passport.use()`
   * @param req Request object from express
   * @param res Response object from express
   */
  public authenticate = (req: Request, res: Response): Promise<User> => {
    return new Promise((resolve, reject) => {
      passport.authenticate("cookie", { session: false }, (err: any, user: User) => {
        if (err) reject(new Error(err));
        else if (!user) reject(new Error("Not authenticated"));
        resolve(user);
      })(req, res);
    });
  };

  /**
   * checkLoggedIn middleware calls the authentication function to
   * validate the users request, is promise rejected, then redirect to login
   * @param req Request object from express
   * @param res Response object from express
   * @param next Next Callback function used to move to the next middleware
   */
  public checkLoggedIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let user: User;
    try {
      user = await this.authenticate(req, res);
    } catch (err) {
      // Either user was not authenticated, or an error occured during authentication
      // In both cases we redirect them to the login
      const queryParam: string = querystring.encode({
        returnto: `${process.env.APPLICATION_URL}${req.originalUrl}`
      });
      res.redirect(`${process.env.AUTH_URL}/login?${queryParam}`);
      return;
    }
    res.locals.authLevel = user.authLevel;
    return next();
  };

  public checkAuthLevel = (req: Request, res: Response, user: User, requiredAuth: AuthLevel): boolean => {
    if (!user || user.authLevel < requiredAuth) {
      const queryParam: string = querystring.encode({ returnto: `${process.env.APPLICATION_URL}${req.originalUrl}` });
      res.redirect(`${process.env.AUTH_URL}/login?${queryParam}`);
      return false;
    }
    return true;
  };

  public checkIsAttendee = (req: Request, res: Response, next: NextFunction): void => {
    if (this.checkAuthLevel(req, res, req.user as User, AuthLevel.Attendee)) {
      res.locals.isAttendee = true;
      return next();
    }
  };

  public checkIsVolunteer = (req: Request, res: Response, next: NextFunction): void => {
    if (this.checkAuthLevel(req, res, req.user as User, AuthLevel.Volunteer)) {
      res.locals.isVolunteer = true;
      return next();
    }
  };

  public checkIsOrganiser = (req: Request, res: Response, next: NextFunction): void => {
    if (this.checkAuthLevel(req, res, req.user as User, AuthLevel.Organiser)) {
      res.locals.isOrganiser = true;
      res.locals.isVolunteer = true;
      return next();
    }
  };
}
