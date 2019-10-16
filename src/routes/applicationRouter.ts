import { Router, Request, Response, RequestHandler, NextFunction } from "express";
import { ApplicationController } from "../controllers";
import { injectable, inject } from "inversify";
import { RouterInterface } from "./registerableRouter";
import { TYPES } from "../types";
import * as multer from "multer";
import { HttpResponseCode } from "../util/errorHandling";
import { checkLoggedIn } from "../util/auth";

@injectable()
export class ApplicationRouter implements RouterInterface {
  private _applicationController: ApplicationController;

  public constructor(@inject(TYPES.ApplicationController) applicationController: ApplicationController) {
    this._applicationController = applicationController;
  }

  private fileUploadHandler: RequestHandler = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // Max file size is 5MB
    },
    fileFilter: function(req, file, cb) {
      // Only allow .pdf, .doc and .docx
      if (
        file.mimetype !== "application/pdf" &&
        file.mimetype !== "application/msword" &&
        file.mimetype !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return cb(new Error("Not valid file format!"), false);
      }
      cb(undefined, true);
    }
  }).any();

  private fileCheckMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    this.fileUploadHandler(req, res, (err: Error) => {
      if (err) {
        res.status(HttpResponseCode.BAD_REQUEST).send({
          error: true,
          message: "File not valid!"
        });
      } else {
        next();
      }
    });
  };

  private checkApplicationsOpen = (req: Request, res: Response, next: NextFunction): void => {
    const applicationsOpenTime: number = new Date(req.app.locals.settings.applicationsOpen).getTime();
    const applicationsCloseTime: number = new Date(req.app.locals.settings.applicationsClose).getTime();
    const currentTime: number = new Date().getTime();

    if (currentTime >= applicationsOpenTime && currentTime <= applicationsCloseTime) {
      next();
    } else {
      return res.redirect("/");
    }
  };

  public getPathRoot(): string {
    return "/apply";
  }

  public register(): Router {
    const router: Router = Router();

    // Protect all the following routes in the router
    // Ensure that at a minimum the user is logged in in order to access the apply page
    router.use(checkLoggedIn);

    router.get("/", this.checkApplicationsOpen, this._applicationController.apply);

    router.post(
      "/",
      this.checkApplicationsOpen,
      this.fileCheckMiddleware,
      this._applicationController.submitApplication
    );

    router.get("/cancel", this._applicationController.cancel);

    return router;
  }
}
