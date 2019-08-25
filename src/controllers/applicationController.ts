import { Request, Response, NextFunction } from "express";

/**
 * A controller for application methods
 */
export class ApplicationController {
  public apply = (req: Request, res: Response, next: NextFunction) => {
    res.render("pages/apply");
  };
}