import { Router } from "express";
import { ApplicationController } from "../controllers";
import { injectable, inject } from "inversify";
import { IRouter } from "./registerableRouter";
import { TYPES } from "../types";

@injectable()
export class ApplicationRouter implements IRouter {
  private _applicationController: ApplicationController;

  public constructor(
    @inject(TYPES.ApplicationController) applicationController: ApplicationController
  ) {
    this._applicationController = applicationController;
  }

  public getPathRoot(): string {
    return "/apply";
  }

  public register(): Router {
    const router: Router = Router();

    router.get("/",
      this._applicationController.apply);

    router.post("/",
      this._applicationController.submitApplication);

    return router;
  }
}