import { Router } from "express";
import { AdminController } from "../controllers";
import { injectable, inject } from "inversify";
import { RouterInterface } from "./registerableRouter";
import { TYPES } from "../types";
import { RequestAuthentication } from "../util/auth";

@injectable()
export class AdminRouter implements RouterInterface {
  private _adminController: AdminController;
  private _requestAuth: RequestAuthentication;

  public constructor(
    @inject(TYPES.AdminController) adminController: AdminController,
    @inject(TYPES.RequestAuthentication) requestAuth: RequestAuthentication
  ) {
    this._adminController = adminController;
    this._requestAuth = requestAuth;
  }

  public getPathRoot = (): string => {
    return "/admin";
  };

  public register = (): Router => {
    const router: Router = Router();

    router.use(this._requestAuth.checkLoggedIn);

    router.get("/overview", this._requestAuth.checkIsOrganiser, this._adminController.overview);

    router.get("/manage", this._requestAuth.checkIsVolunteer, this._adminController.manage);

    router.get("/manage/downloadCSV", this._requestAuth.checkIsOrganiser, this._adminController.downloadCSV);

    router.get(
      "/manage/download-cvs",
      this._requestAuth.checkIsOrganiser,
      this._adminController.downloadAllCVsFromDropbox
    );

    router.get("/manage/[a-z0-9-]+", this._requestAuth.checkIsOrganiser, this._adminController.manageApplication);

    return router;
  };
}
