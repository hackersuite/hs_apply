import * as express from "express";

export interface IRouter {
  /**
   * The initial route for requests to intercept in the router
   */
  getPathRoot(): string;

  /**
   * Router setup function that registers all the routes
   */
  register(): express.Router;
}