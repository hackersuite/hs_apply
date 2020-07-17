/* eslint-disable no-duplicate-imports */
/* This rule has been disabled as the imports are done logically */

import { Container } from 'inversify';
import { TYPES } from './types';

// Services
import services from './services/bindings';

// Controllers
import controllers from './controllers/bindings';

// Routers
import routers from './routes/bindings';

// Repositories
import repositories from './repositories/bindings';

// Cache
import { CacheInterface, Cache } from './util/cache';

// Request Authenticationn
import { RequestAuthenticationInterface, RequestAuthentication } from './util/auth';

// SettingLoader
import { SettingLoaderInterface, SettingLoader } from './util/fs';

const container = new Container();

// Load all the container modules
container.load(services, controllers, routers, repositories);

// Request Authentication
container.bind<RequestAuthenticationInterface>(TYPES.RequestAuthentication).to(RequestAuthentication);

// SettingLoader
container.bind<SettingLoaderInterface>(TYPES.SettingLoader).to(SettingLoader);

// Constants
container.bind<CacheInterface>(TYPES.Cache).toConstantValue(new Cache());

export default container;
