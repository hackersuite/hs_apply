import { Cacheable } from '../util/cache';
import { AppConfig } from '../settings';

export class HackathonConfig implements Cacheable {
	public id: number;
	public config: AppConfig;

	// The lifetime of this object in the cache is infinite
	public expiresIn = -1;

	public constructor(config: AppConfig) {
		this.id = 0;
		this.config = config;
	}
}
