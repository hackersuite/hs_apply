import { Router } from "express";
import { DashboardController } from "../controllers";
import { injectable, inject } from "inversify";
import { RouterInterface } from "./registerableRouter";
import { TYPES } from "../types";
import { RequestAuthentication } from "../util/auth";

@injectable()
export class DashboardRouter implements RouterInterface {
  private _dashboardController: DashboardController;
  private _requestAuth: RequestAuthentication;

  public constructor(
    @inject(TYPES.DashboardController) dashboardController: DashboardController,
    @inject(TYPES.RequestAuthentication) requestAuth: RequestAuthentication
  ) {
    this._dashboardController = dashboardController;
    this._requestAuth = requestAuth;
  }

  public getPathRoot = (): string => {
    return "/";
  };

  public register = (): Router => {
    const router: Router = Router();

    router.use(this._requestAuth.checkLoggedIn);

    router.get("/", this._dashboardController.dashboard);

    return router;
  };
}
