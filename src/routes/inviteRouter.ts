import { Router } from "express";
import { InviteController } from "../controllers";
import { injectable, inject } from "inversify";
import { RouterInterface } from "./registerableRouter";
import { TYPES } from "../types";
import { RequestAuthentication } from "../util/auth";

@injectable()
export class InviteRouter implements RouterInterface {
  private _inviteController: InviteController;
  private _requestAuth: RequestAuthentication;

  public constructor(
    @inject(TYPES.InviteController) inviteController: InviteController,
    @inject(TYPES.RequestAuthentication) requestAuth: RequestAuthentication
  ) {
    this._inviteController = inviteController;
    this._requestAuth = requestAuth;
  }

  public getPathRoot = (): string => {
    return "/invite";
  };

  public register = (): Router => {
    const router: Router = Router();

    router.post(
      "/batchSend",
      this._requestAuth.checkLoggedIn,
      this._requestAuth.checkIsOrganiser,
      this._inviteController.batchSend
    );

    router.put(
      "/:id([a-f0-9-]+)/send",
      this._requestAuth.checkLoggedIn,
      this._requestAuth.checkIsOrganiser,
      this._inviteController.send
    );

    router.get("/:id([a-f0-9-]+)/confirm", this._inviteController.confirm);

    return router;
  };
}
