import { Router } from "express";
import { DashboardController } from "../controllers";
import { injectable, inject } from "inversify";
import { RouterInterface } from "./registerableRouter";
import { TYPES } from "../types";
import { checkLoggedIn } from "../util/auth";

@injectable()
export class DashboardRouter implements RouterInterface {
  private _dashboardController: DashboardController;

  public constructor(@inject(TYPES.DashboardController) dashboardController: DashboardController) {
    this._dashboardController = dashboardController;
  }

  public getPathRoot(): string {
    return "/";
  }

  public register(): Router {
    const router: Router = Router();

    router.use(checkLoggedIn);

    router.get("/", this._dashboardController.dashboard);

    return router;
  }
}
