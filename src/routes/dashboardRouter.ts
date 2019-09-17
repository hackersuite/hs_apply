import { Router } from "express";
import { ApplicationController, DashboardController } from "../controllers";
import { injectable, inject } from "inversify";
import { IRouter } from "./registerableRouter";
import { TYPES } from "../types";

@injectable()
export class DashboardRouter implements IRouter {
  private _dashboardController: DashboardController;

  public constructor(
    @inject(TYPES.DashboardController) dashboardController: DashboardController
  ) {
    this._dashboardController = dashboardController;
  }

  public getPathRoot(): string {
    return "/";
  }

  public register(): Router {
    const router: Router = Router();

    router.get("/",
      this._dashboardController.dashboard);

    return router;
  }
}