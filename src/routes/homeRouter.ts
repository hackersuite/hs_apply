import { Router } from "express";
import { ApplicationController } from "../controllers";
import { injectable, inject } from "inversify";
import { IRouter } from "./registerableRouter";
import { TYPES } from "../types";

@injectable()
export class HomeRouter implements IRouter {
  @inject(TYPES.ApplicationController)
  private applicationController: ApplicationController;

  public getPathRoot(): string {
    return "/";
  }

  public register(): Router {
    const router: Router = Router();

    router.get("/apply",
      this.applicationController.apply);

    router.post("/submitApplication",
      this.applicationController.submitApplication);

    return router;
  }
}