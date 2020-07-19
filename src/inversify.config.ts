import { Container } from 'inversify';
import { buildProviderModule } from 'inversify-binding-decorators';

// Cache
import { Cache } from './util/cache';

const container = new Container();

// Load all injectable classes that are marked with the '@provide' annotation
container.load(buildProviderModule());

// Constants
container.bind<Cache>(Cache).toConstantValue(new Cache());

export default container;
