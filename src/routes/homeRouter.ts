import { Router } from "express";
import { ApplicationController } from "../controllers";
import { Cache } from "../util/cache";

export const homeRouter = (cache: Cache): Router => {

  const router = Router();
  const applicationController = new ApplicationController(cache);

  router.get("/apply",
    applicationController.apply);

  return router;
};