import * as fs from "fs";
import { Express } from "express";
import { ApplicationSectionInterface, HackathonSettingsInterface } from "../../settings";
import { Sections, HackathonSettings } from "../../models";
import { TYPES } from "../../types";
import { Cache } from "../cache";
import { promisify } from "util";
import { injectable, inject } from "inversify";
import { logger } from "../logger";

export interface SettingLoaderInterface {
  loadApplicationSettings: (app: Express) => Promise<void>;
  loadSettingsFile: <T>(fileName: string, obj?: string) => Promise<T>;
}

@injectable()
export class SettingLoader implements SettingLoaderInterface {
  private readonly readFileAsync = promisify(fs.readFile);
  private readonly cache: Cache;

  public constructor(@inject(TYPES.Cache) _cache: Cache) {
    this.cache = _cache;
    this.loadApplicationSettings = this.loadApplicationSettings.bind(this);
  }

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
  // TODO: Improve this function by not awaiting both loads seperately
  public async loadApplicationSettings(app: Express): Promise<void> {
    logger.info("Loading hackathon application questions...");
    const sections: Array<ApplicationSectionInterface> = await this.loadSettingsFile("questions.json", "sections");
    if (sections) {
      const applicationSections: Sections = new Sections(sections);
      this.cache.set(Sections.name, applicationSections);
      logger.info("Loaded application questions");
    }

    logger.info("Loading hackathon application settings...");
    const settings: HackathonSettingsInterface = await this.loadSettingsFile("hackathon.json");
    if (settings) {
      // Add the hackathon settings to the cache and add them to app locals
      const hackathonSettings: HackathonSettings = new HackathonSettings(settings);
      this.cache.set(HackathonSettings.name, hackathonSettings);
      app.locals.settings = hackathonSettings.settings;
      logger.info(hackathonSettings.settings, "Loaded hackathon settings");
    } else {
      // We couldn't load the hackathon settings so set some defaults
      app.locals.settings = {
        shortName: "Hackathon",
        fullName: "Hackathon",
        applicationsOpen: new Date().toString(),
        applicationsClose: new Date(Date.now() + 10800 * 1000).toString() // 3 hours from now
      };
    }
  }
  public loadSettingsFile = async <T>(fileName: string, obj?: string): Promise<T> => {
    // Check if the file exists in the current directory, and if it is writable.
    let settings: T;
    try {
      const fileBuffer: string = await this.readFileAsync(__dirname + `/../../settings/${fileName}`, {
        encoding: "utf8"
      });
      settings = obj ? JSON.parse(fileBuffer)[obj] : JSON.parse(fileBuffer);
      // Handle non-exception-throwing cases
      if (!settings && typeof settings !== "object") {
        throw "Failed to parse JSON";
      }
    } catch (err) {
      logger.warn("Failed to load settings!");
      return undefined;
    }
    return settings;
  };
}
