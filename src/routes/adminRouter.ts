import { Router } from "express";
import { AdminController } from "../controllers";
import { injectable, inject } from "inversify";
import { RouterInterface } from "./registerableRouter";
import { TYPES } from "../types";
import { checkIsOrganizer, checkLoggedIn } from "../util/auth";

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
    router.use(checkIsOrganizer);

    router.get("/overview", this._adminController.overview);

    router.get("/manage", this._adminController.manage);

    router.get("/manage/downloadCSV", this._adminController.downloadCSV);

    router.get("/manage/[a-z0-9-]+", this._adminController.manageApplication);

    return router;
  }
}
