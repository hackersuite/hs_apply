import { Router } from "express";
import { AdminController } from "../controllers";
import { injectable, inject } from "inversify";
import { IRouter } from "./registerableRouter";
import { TYPES } from "../types";

@injectable()
export class AdminRouter implements IRouter {
  private _adminController: AdminController;

  public constructor(
    @inject(TYPES.AdminController) adminController: AdminController
  ) {
    this._adminController = adminController;
  }

  public getPathRoot(): string {
    return "/admin";
  }

  public register(): Router {
    const router: Router = Router();

    router.get("/overview",
      this._adminController.overview);

    router.get("/manage",
      this._adminController.manage);

    return router;
  }
}