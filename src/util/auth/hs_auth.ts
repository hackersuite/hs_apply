import * as passport from "passport";
import * as request from "request-promise-native";
import * as querystring from "querystring";
import { Request, Response, Application, NextFunction } from "express";
import { HttpResponseCode } from "../errorHandling";
import * as CookieStrategy from "passport-cookie";

type DoneFunction = (error: any, user?: any) => void;

export const passportSetup = (app: Application) => {
  app.use(passport.initialize());
  passport.use(new CookieStrategy({
    cookieName: "Authorization",
    passReqToCallback: true
  }, async (req: Request, token: string, done: DoneFunction): Promise<any> => {
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
      return done(undefined, {
        "auth_id": result.user_id,
        "auth_level": result.auth_level
      });
    }
  }));
};

export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("cookie", { session: false }, (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      const queryParam: string = querystring.encode({"returnto": "http://localhost:8010/apply"});
      return res.redirect(`http://localhost:8000/login?${queryParam}`);
    }
    req.user = user;
    return next();
  })(req, res, next);
  // passport.authenticate("hs-auth", { session: false }, function(err, user, info) {
  //   if (err) { return next(err); }
  //   if (!user) {
  //     const queryParam: string = querystring.encode({"returnto": "http://localhost:8010/apply"});
  //     return res.redirect(`http://localhost:8000/login?${queryParam}`);
  //   }
  //   delete user.auth_token;
  //   req.logIn(user, function(err) {
  //     if (err) { return next(err); }
  //     return next();
  //   });
  // })(req, res, next);
  // passport.authenticate("hs-auth", { session: false }, (err, user, info) => {
  //   // Check if some internal error has occured
  //   if (err) return next(err);
  //   // console.log(info);
  //   // console.log(user);
  //   // if (info) {
  //   //   const parsedInfo: ChallengeResponse = JSON.parse(info);
  //   //   if (parsedInfo.error === HttpResponseCode.BAD_REQUEST.toString()) {
  //   //     // The Authorization header was empty so redirect to the login page
  //   //     console.log("The Authorization header was empty so redirect to the login page");
  //   //     const queryParam: string = querystring.encode({"returnto": "http://localhost:8010/apply"});
  //   //     return res.redirect(`http://localhost:8000/login?${queryParam}`);
  //   //   } else if (parsedInfo.error === HttpResponseCode.UNAUTHORIZED.toString()) {
  //   //     // The Authorization token was invalid so redirect back to login
  //   //     console.log("The Authorization token was invalid so redirect back to login");
  //   //     const queryParam: string = querystring.encode({"returnto": "http://localhost:8010/apply"});
  //   //     return res.redirect(`http://localhost:8000/login?${queryParam}`);
  //   //   }
  //   // }
  //   if (!user) {
  //     // Redirect to the login page
  //     const queryParam: string = querystring.encode({"returnto": "http://localhost:8010/apply"});
  //     return res.redirect(`http://localhost:8000/login?${queryParam}`);
  //   } else {
  //     // Request has been authenticated
  //     // Check if the user is already in the applications system
  //     console.log("Authed");
  //     res.header("Authorization", user.auth_token);
  //     delete user.auth_token;
  //     console.log(user);
  //     // console.log(res.getHeaders());
  //     // console.log(` with token ${req.headers.authorization || req.query.access_token}`);
  //     // res.setHeader("Authorization", req.headers.authorization || req.query.access_token);
  //     next();
  //   }
  // })(req, res, next);
};