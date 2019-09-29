import "reflect-metadata";
import * as fs from "fs";
import * as express from "express";
import * as dotenv from "dotenv";
import * as path from "path";
import * as morgan from "morgan";
import * as cookieParser from "cookie-parser";
import { IApplicationSection, IHackathonSettings } from "./settings";
import { Express, Request, Response, NextFunction } from "express";
import { ConnectionOptions, createConnections, Connection } from "typeorm";
import { IRouter } from "./routes";
import { Cache } from "./util/cache";
import { promisify } from "util";
import { Sections, HackathonSettings } from "./models";
import { TYPES } from "./types";
import container from "./inversify.config";
import { error404Handler, errorHandler } from "./util/errorHandling";
import { RequestAuthentication } from "./util/auth";

// Load environment variables from .env file
dotenv.config({ path: ".env" });

export class App {
  private readonly readFileAsync = promisify(fs.readFile);
  private readonly cache: Cache = container.get(TYPES.Cache);

  public async buildApp(
    callback: (app: Express, err?: Error) => void,
    connectionOptions?: ConnectionOptions[]
  ): Promise<void> {
    const app: Express = this.expressSetup();

    // Set up express middleware for request routing
    this.middlewareSetup(app);

    if (app.get("env") === "dev") {
      this.devMiddlewareSetup(app);
    }

    // Load the hackathon application settings from disk
    await this.loadApplicationSettings(app);

    // Connecting to database
    const databaseConnectionSettings: ConnectionOptions[] =
      connectionOptions || this.createDatabaseSettings();

    createConnections(databaseConnectionSettings)
      .then(async (connections: Connection[]) => {
        connections.forEach(element => {
          console.log(
            "  Connection to database (" + element.name + ") established."
          );
        });

        // Set up passport for authentication
        // Also add the logout route
        const requestAuth: RequestAuthentication = container.get(TYPES.RequestAuthentication);
        requestAuth.passportSetup(app);

        // Routes set up for express, resolving dependencies
        // This is performed after successful DB connection since some routers use TypeORM repositories in their DI
        const routers: IRouter[] = container.getAll(TYPES.Router);
        routers.forEach(router => {
          app.use(router.getPathRoot(), router.register());
        });

        // Setting up error handlers
        app.use(error404Handler);
        app.use(errorHandler);

        return callback(app);
      })
      .catch((err: any) => {
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
      express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
    );

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    // app.use(expressSession(this.getSessionOptions(app)));
  };

  /**
   * Sets up middleware used on development environments
   * @param app The app to set up the middleware for
   */
  private devMiddlewareSetup = (app: Express): void => {
    // Request logging
    app.use(morgan("dev"));
    // Disable browser caching
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.header(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate"
      );
      res.header("Expires", "-1");
      res.header("Pragma", "no-cache");
      next();
    });
  };

  /**
   * Loads the questions settings into Cache
   *
   * Questions are stored under the name `Questions`
   *
   * Hackathon settings are stored under `Hackathon`
   *
   * Also loads the hackathon settings into app.locals for use in EJS templates
   *
   * If you update the hackathon settings, you need to restart the application
   */
  private loadApplicationSettings = async (app: Express): Promise<void> => {
    console.log("Loading hackathon application questions...");
    const sections: Array<IApplicationSection> = await this.loadSettingsFile("questions.json", "sections");
    if (sections) {
      const applicationSections: Sections = new Sections(sections);
      this.cache.set(Sections.name, applicationSections);
      console.log("\tLoaded application questions");
    }

    console.log("Loading hackathon application settings...");
    const settings: IHackathonSettings = await this.loadSettingsFile("hackathon.json");
    if (settings) {
      const hackathonSettings: HackathonSettings = new HackathonSettings(settings);
      this.cache.set(HackathonSettings.name, hackathonSettings);
      app.locals.settings = hackathonSettings.settings;
      console.log("\tLoaded application settings");
    } else {
      // We couldn't load the hackathon settings so set some defaults
      app.locals.settings = {
        "shortName": "Hackathon",
        "fullName": "Hackathon",
        "applicationsOpen": new Date(),
        "applicationsClose": new Date(Date.now() + 10800 * 1000) // 3 hours from now
      };
    }
  };
  private loadSettingsFile = async <T>(fileName: string, obj?: string): Promise<T> => {
    // Check if the file exists in the current directory, and if it is writable.
    let settings: T;
    try {
      const fileBuffer: string = await this.readFileAsync(
        __dirname + `/settings/${fileName}`,
        { encoding: "utf8" }
      );
      settings = obj ? JSON.parse(fileBuffer)[obj] : JSON.parse(fileBuffer);
      // Handle non-exception-throwing cases
      if (!settings && typeof settings !== "object") {
        throw "Failed to parse JSON";
      }
    } catch (err) {
      console.error("  Failed to load settings!");
      return undefined;
    }
    return settings;
  }

  private getSessionOptions = (app: Express): any => {
    return {
      saveUninitialized: true, // Saved new sessions
      resave: false, // Do not automatically write to the session store
      secret: process.env.SESSION_SECRET,
      cookie: {
        // Configure when sessions expires
        secure: app.get("env") === "dev" ? false : true,
        maxAge: 2419200000
      }
    };
  };

  private createDatabaseSettings = (): ConnectionOptions[] => {
    return [
      {
        name: "applications",
        type: "mysql",
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [__dirname + "/models/db/*{.js,.ts}"],
        synchronize: true
      }
    ];
  };
}
