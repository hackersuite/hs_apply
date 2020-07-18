import express from 'express';
import { fluentProvide } from 'inversify-binding-decorators';

export const RouterSymbol = 'Router';
export const provideRouter = function() {
	return fluentProvide(RouterSymbol)
		.whenTargetNamed(RouterSymbol)
		.done();
};

/**
 * In order to add a new route for requests, make sure you have done the following:
 * 1. Create a new class that implements this interface and has the `@injectable()` annotation
 * 2. Inject a controller into the router constructor
 * 3. Add the root path for the request in the `getPathRoot()` function. i.e. `/apply` or `/admin`
 * 4. Add all the route handlers in the `register` function that returns an instace of `express.Router`
 * 5. Add the new router to the `bindings.ts` file using `container.bind<RouterInterface>(TYPES.Router).to(yourNewRouter);`
 */
export interface RouterInterface {
	/**
   * The initial route for requests to intercept in the router
   */
	getPathRoot: () => string;

	/**
   * Router setup function that registers all the routes
   */
	register: () => express.Router;
}
