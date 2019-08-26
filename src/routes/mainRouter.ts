import { Router } from "express";
import { homeRouter } from "./";
import { Cache } from "../util/cache";

/**
 * Top-level router for the app
 */
export const mainRouter = (cache: Cache): Router => {
  const router = Router();

  router.use((req, res, next) => {
    if (req.get("X-Forwarded-Proto") !== "https" && process.env.USE_SSL) {
      res.redirect("https://" + req.headers.host + req.url);
    } else {
      return next();
    }
  });

  // Requests to /*
  router.use("/", homeRouter(cache));

  return router;
};