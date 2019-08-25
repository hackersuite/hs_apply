import "reflect-metadata";
import * as express from "express";
import * as dotenv from "dotenv";
import * as path from "path";
import * as morgan from "morgan";
import * as passport from "passport";
import * as expressSession from "express-session";
import * as cookieParser from "cookie-parser";
import { Express, Request, Response, NextFunction } from "express";
import { mainRouter } from "./routes";

// Load environment variables from .env file
dotenv.config({ path: ".env" });


// codebeat:disable[LOC]
export function buildApp(callback: (app: Express, err?: Error) => void): void {
  const app: Express = expressSetup();

  middlewareSetup(app);

  devMiddlewareSetup(app);

  // Set up passport
  passportSetup(app);

  // Routes set up
  app.use("/", mainRouter());

  return callback(app);
}

/**
 * Creates an Express app
 */
const expressSetup = (): Express => {
  // Create Express server
  const app = express();

  // view engine setup
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");

  // Express configuration
  app.set("port", process.env.PORT || 3000);
  app.set("env", process.env.ENVIRONMENT || "production");
  if (process.env.ENVIRONMENT === "production") {
    app.set("trust proxy", 1);
  }

  return app;
};

/**
 * Sets up middleware used by the app
 * @param app The app to set up the middleware for
 */
const middlewareSetup = (app: Express): void => {
  app.use(
    express.static(path.join(__dirname, "public"),
      { maxAge: 31557600000 })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(expressSession(getSessionOptions(app)));
};

/**
 * Sets up middleware used on development environments
 * @param app The app to set up the middleware for
 */
const devMiddlewareSetup = (app: Express): void => {
  // Development environment set up
  if (app.get("env") === "dev") {
    // Request logging
    app.use(morgan("dev"));
    // Disable browser caching
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
      res.header("Expires", "-1");
      res.header("Pragma", "no-cache");
      next();
    });
  }
};

/**
 * Creates the passport middleware for handling user authentication
 * @param app The app to set up the middleware for
 */
const passportSetup = (app: Express): void => {
  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());
  // passport.use(passportLocalStrategy(userService));
};

const getSessionOptions = (app: Express): any => {
  return {
    saveUninitialized: true, // Saved new sessions
    resave: false, // Do not automatically write to the session store
    secret: process.env.SESSION_SECRET,
    cookie: { // Configure when sessions expires
      secure: (app.get("env") === "dev" ? false : true),
      maxAge: 2419200000
    }
  };
};
