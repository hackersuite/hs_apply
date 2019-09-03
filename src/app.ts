import "reflect-metadata";
import * as fs from "fs";
import * as express from "express";
import * as dotenv from "dotenv";
import * as path from "path";
import * as morgan from "morgan";
import * as passport from "passport";
import * as expressSession from "express-session";
import * as cookieParser from "cookie-parser";
import { IApplicationSection } from "./settings";
import { Express, Request, Response, NextFunction } from "express";
import { ConnectionOptions, createConnections, Connection } from "typeorm";
import { IRouter } from "./routes";
import { Cache } from "./util/cache";
import { promisify } from "util";
import { Sections } from "./models/sections";
import { TYPES } from "./types";
import container from "./inversify.config";
import { error404Handler, errorHandler } from "./util/errorHandling";

// Load environment variables from .env file
dotenv.config({ path: ".env" });

export class App {
  private readonly readFileAsync = promisify(fs.readFile);
  private readonly cache: Cache = container.get(TYPES.Cache);

  public async buildApp(callback: (app: Express, err?: Error) => void): Promise<void> {
    const app: Express = this.expressSetup();

    // Set up express middleware for request routing
    this.middlewareSetup(app);
    this.devMiddlewareSetup(app);

    // Load the hackathon application settings from disk
    await this.loadApplicationSettings();

    // Connecting to database
    const databaseConnectionSettings: ConnectionOptions[] = this.createDatabaseSettings();
    createConnections(databaseConnectionSettings).then(async (connections: Connection[]) => {
      connections.forEach(element => {
        console.log("  Connection to database (" + element.name + ") established.");
      });

      // Routes set up for express, resolving dependencies
      // This is performed after successful DB connection since some routers use TypeORM repositories in their DI
      const routers: IRouter[] = container.getAll(TYPES.Router);
      routers.forEach((router) => {
        app.use(router.getPathRoot(), router.register());
      });

      // Setting up error handlers
      app.use(error404Handler);
      app.use(errorHandler);

      // Set up passport for authentication
      this.passportSetup(app);

      return callback(app);
    }).catch((err: any) => {
      console.error("  Could not connect to database");
      console.error(err);
      return callback(app, err);
    });
  }

  /**
   * Creates an Express app
   */
  private expressSetup = (): Express => {
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
  private middlewareSetup = (app: Express): void => {
    app.use((req, res, next) => {
      if (req.get("X-Forwarded-Proto") !== "https" && process.env.USE_SSL) {
        res.redirect("https://" + req.headers.host + req.url);
      } else {
        return next();
      }
    });

    app.use(
      express.static(path.join(__dirname, "public"),
        { maxAge: 31557600000 })
    );

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(expressSession(this.getSessionOptions(app)));
  };

  /**
   * Sets up middleware used on development environments
   * @param app The app to set up the middleware for
   */
  private devMiddlewareSetup = (app: Express): void => {
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
  private passportSetup = (app: Express): void => {
    // Passport configuration
    app.use(passport.initialize());
    app.use(passport.session());
    // passport.use(passportLocalStrategy(userService));
  };

  /**
   * Loads the applications settings into Cache
   * Questions are stored under the name `Questions`
   * Hackathon settings are stored under `Hackathon`
   */
  private loadApplicationSettings = async (): Promise<void> => {
    // Check if the file exists in the current directory, and if it is writable.
    console.log("Loading hackathon application settings...");

    let sections: Array<IApplicationSection>;
    try {
      const fileBuffer: string = await this.readFileAsync("src/settings/questions.json", { encoding: "utf8" });
      sections = JSON.parse(fileBuffer).sections;
      // Handle non-exception-throwing cases
      if (!sections && typeof sections !== "object") {
        throw "Failed to parse JSON";
      }
    } catch (err) {
      throw "Failed to load questions";
    }
    const applicationSections: Sections = new Sections(sections);
    this.cache.set(Sections.name, applicationSections);

    console.log("Done loading settings!");
  };

  private getSessionOptions = (app: Express): any => {
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

  private createDatabaseSettings = (): ConnectionOptions[] => {
    return [{
      name: "applications",
      type: "mysql",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        __dirname + "/models/db/*{.js,.ts}"
      ],
      synchronize: true
    }];
  };

}