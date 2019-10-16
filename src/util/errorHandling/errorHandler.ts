import { Request, Response } from "express";
import { ApiError } from "./apiError";
import { HttpResponseCode } from "./httpResponseCode";

// const toEmails: string[] = ["admin@unicsmcr.com"];

/**
 * Handles errors thrown by requests
 */
export const errorHandler = (err: ApiError | Error, req: Request, res: Response): void => {
  if (err instanceof Error) {
    if (process.env.ENVIRONMENT === "production") {
      // Send notification to admins when an uncaught error occurs
      //   sendEmail("noreply@unicsmcr.com",
      //   toEmails,
      //     "Uncaught Error: " + err.name,
      //     err.message + err.stack
      //   );
    }

    console.error(err.stack);
    res.status(HttpResponseCode.INTERNAL_ERROR).send("An error occured.");
  } else {
    res.status(err.statusCode).send(err);
  }
};

/**
 * Handles 404 errors
 */
export const error404Handler = (req: Request, res: Response): void => {
  const apiError: ApiError = new ApiError(HttpResponseCode.NOT_FOUND);
  res.render("pages/404", { error: apiError });
};
