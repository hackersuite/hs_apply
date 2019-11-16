import { Router } from "express";
import { AdminController } from "../controllers";
import { injectable, inject } from "inversify";
import { RouterInterface } from "./registerableRouter";
import { TYPES } from "../types";
import { checkIsOrganizer, checkIsVolunteer, checkLoggedIn } from "../util/auth";

@injectable()
export class AdminRouter implements RouterInterface {
  private _adminController: AdminController;

  public constructor(@inject(TYPES.AdminController) adminController: AdminController) {
    this._adminController = adminController;
  }

  public getPathRoot(): string {
    return "/admin";
  }

  public register(): Router {
    const router: Router = Router();

    router.use(checkLoggedIn);

    router.get("/overview", checkIsOrganizer, this._adminController.overview);

    router.get("/manage", checkIsVolunteer, this._adminController.manage);

    router.get("/manage/downloadCSV", checkIsOrganizer, this._adminController.downloadCSV);

    router.get("/manage/[a-z0-9-]+", checkIsOrganizer, this._adminController.manageApplication);

    return router;
  }
}
