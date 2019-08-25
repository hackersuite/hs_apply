import { Router } from "express";
import { ApplicationController } from "../controllers";

export const homeRouter = (): Router => {

  const router = Router();
  const applicationController = new ApplicationController();

  router.get("/apply",
    applicationController.apply);

  return router;
};