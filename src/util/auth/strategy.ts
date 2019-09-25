import * as passport from "passport";
import { Request } from "express";
import { HttpResponseCode } from "../errorHandling";

export class AuthStrategy extends passport.Strategy {

  public name: string;
  private _verify: Function;
  private _passReqToCallback: boolean;
  private _cookieName: string;

  constructor(options, verify) {
    super();
    this.name = "hs-auth";

    if (typeof options == "function") {
      verify = options;
      options = {};
    }
    if (!verify) { throw new TypeError("HTTPBearerStrategy requires a verify callback"); }

    this._verify = verify;
    this._cookieName = options.cookieName;
    this._passReqToCallback = options.passReqToCallback;
  }

  /**
   * Authenticate request based on the contents of a HTTP Bearer authorization
   * header, body parameter, or query parameter.
   *
   * @param {Request} req
   * @api protected
   */
  public authenticate(req: Request) {
    let token: string = undefined;

    // if (req.headers && req.headers.authorization) {
    //   token = req.headers.authorization;
    // }

    // if (req.query && req.query.access_token) {
    //   if (token) { return this.fail(400); }
    //   token = req.query.access_token;
    // }

    if (req.cookies[this._cookieName]) {
      token = req.cookies[this._cookieName];
    }

    if (!token) {
      return this.fail(this.challenge(HttpResponseCode.BAD_REQUEST.toString(), "no token provided"));
    }

    const verified = (err, user, info) => {
      if (err) { return this.error(err); }
      if (!user) {
        if (typeof info == "string") {
          info = {
            message: info
          };
        }
        info = info || {};
        return this.fail(this.challenge(HttpResponseCode.UNAUTHORIZED.toString(), "invalid token", info.message));
      }
      this.success(user, info);
    };

    if (this._passReqToCallback) {
      this._verify(req, token, verified);
    } else {
      this._verify(token, verified);
    }
  }

  /**
   * Build authentication challenge.
   *
   * @api private
   */
  private challenge(code?: string, desc?: string, uri?: string): string {
    const challenge: ChallengeResponse = {};

    if (code) {
      challenge.error = code;
    }
    if (desc && desc.length) {
      challenge.error_description = desc;
    }
    if (uri && uri.length) {
      challenge.error_uri = uri;
    }

    return JSON.stringify(challenge);
  }
}

export interface ChallengeResponse {
  error?: string;
  error_description?: string;
  error_uri?: string;
}
