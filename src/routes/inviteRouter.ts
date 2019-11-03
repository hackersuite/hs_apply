import { Router } from "express";
import { InviteController } from "../controllers";
import { injectable, inject } from "inversify";
import { RouterInterface } from "./registerableRouter";
import { TYPES } from "../types";
import { checkLoggedIn, checkIsOrganizer } from "../util/auth";

@injectable()
export class InviteRouter implements RouterInterface {
  private _inviteController: InviteController;

  public constructor(@inject(TYPES.InviteController) inviteController: InviteController) {
    this._inviteController = inviteController;
  }

  public getPathRoot(): string {
    return "/invite";
  }

  public register(): Router {
    const router: Router = Router();

    router.post("/batchSend", checkLoggedIn, checkIsOrganizer, this._inviteController.batchSend);

    router.put("/:id([a-f0-9-]+)/send", checkLoggedIn, checkIsOrganizer, this._inviteController.send);

    router.get("/:id([a-f0-9-]+)/confirm", this._inviteController.confirm);

    return router;
  }
}
