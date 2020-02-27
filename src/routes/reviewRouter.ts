import { Router } from "express";
import { ReviewController } from "../controllers";
import { injectable, inject } from "inversify";
import { RouterInterface } from "./registerableRouter";
import { TYPES } from "../types";
import { RequestAuthentication } from "../util/auth";

@injectable()
export class ReviewRouter implements RouterInterface {
  private _reviewController: ReviewController;
  private _requestAuth: RequestAuthentication;

  public constructor(
    @inject(TYPES.ReviewController) reviewController: ReviewController,
    @inject(TYPES.RequestAuthentication) requestAuth: RequestAuthentication
  ) {
    this._reviewController = reviewController;
    this._requestAuth = requestAuth;
  }

  public getPathRoot = (): string => {
    return "/review";
  };

  public register = (): Router => {
    const router: Router = Router();

    router.use(this._requestAuth.checkLoggedIn);

    router.get("/", this._requestAuth.checkIsVolunteer, this._reviewController.reviewPage);

    router.get("/next", this._requestAuth.checkIsVolunteer, this._reviewController.nextReview);

    router.post(
      "/submit",
      this._requestAuth.checkLoggedIn,
      this._requestAuth.checkIsVolunteer,
      this._reviewController.submit,
      this._reviewController.nextReview,
    );

    router.get(
      "/getListing", this._reviewController.getReviews
    )

    return router;
  };
}
