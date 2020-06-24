import { Express } from "express";
import { App } from "./app";
import { logger } from "./util";

/**
 * Start Express server.
 */

new App().buildApp((app: Express, err?: Error) => {
  if (err) {
    logger.error("Could not start server!");
  } else {
    app.listen(app.get("port"), () => {
      logger.info("App is running at http://localhost:%d in %s mode", app.get("port"), app.get("env"));
      logger.info("Press CTRL-C to stop\n");
    });
  }
});
