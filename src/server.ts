import { Express } from "express";
import { App } from "./app";

/**
 * Start Express server.
 */

new App().buildApp((app: Express, err: Error) => {
  if (err) {
    console.error("Could not start server!");
  } else {
    app.listen(app.get("port"), () => {
      console.log("  App is running at http://localhost:%d in %s mode", app.get("port"), app.get("env"));
      console.log("  Press CTRL-C to stop\n");
    });
  }
});
