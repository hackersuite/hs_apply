import { Cacheable } from '../util/cache';
import { HackathonSettingsInterface } from '../settings';

export class HackathonSettings implements Cacheable {
	id: number;
	settings: HackathonSettingsInterface;

	// The lifetime of this object in the cache is infinite
	expiresIn = -1;

	constructor(settings: HackathonSettingsInterface) {
		this.id = 0;
		this.settings = settings;
	}
}
