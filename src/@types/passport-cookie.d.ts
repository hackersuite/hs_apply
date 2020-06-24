declare module 'passport-cookie' {
	import passport from 'passport';
	export default class CookieStrategy implements passport.Strategy {
		name?: string;
		authenticate(this: StrategyCreated<this>, req: express.Request, options?: any): any;
		constructor (options: function|Record<string, any>, deserializeUser: function);
	}
}
