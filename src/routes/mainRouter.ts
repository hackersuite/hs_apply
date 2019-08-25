import { Router } from "express";
import { homeRouter } from "./";

/**
 * Top-level router for the app
 */
export const mainRouter = (): Router => {
  const router = Router();

  router.use((req, res, next) => {
    if (req.get("X-Forwarded-Proto") !== "https" && process.env.USE_SSL) {
      res.redirect("https://" + req.headers.host + req.url);
    } else {
      return next();
    }
  });

  // Requests to /*
  router.use("/", homeRouter());

  return router;
};