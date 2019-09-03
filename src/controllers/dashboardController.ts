import { Request, Response, NextFunction } from "express";
import { Cache } from "../util/cache";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";

export interface IDashboardController {
  dashboard: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * A controller for dashboard methods
 */
@injectable()
export class DashboardController {
  private _cache: Cache;

  public constructor(
    @inject(TYPES.Cache) cache: Cache,
  ) {
    this._cache = cache;
  }

  public dashboard = (req: Request, res: Response, next: NextFunction): void => {
    res.render("pages/dashboard");
  };
}