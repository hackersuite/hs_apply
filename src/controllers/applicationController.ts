import { Request, Response, NextFunction } from "express";
import { IApplicationSection } from "../settings";
import { Cache } from "../util/cache";
import { Sections } from "../models/sections";

/**
 * A controller for application methods
 */
export class ApplicationController {
  private cache: Cache;

  constructor(_cache: Cache) {
    this.cache = _cache;
  }

  public apply = (req: Request, res: Response, next: NextFunction) => {
    const cachedSections: Array<Sections> = this.cache.getAll(Sections.name);
    const sections = cachedSections[0].sections;
    res.render("pages/apply", { sections: sections });
  };
}