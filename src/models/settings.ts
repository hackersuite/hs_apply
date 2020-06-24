import { Cacheable } from '../util/cache';
import { HackathonSettingsInterface } from '../settings';

export class HackathonSettings implements Cacheable {
	public id: number;
	public settings: HackathonSettingsInterface;

	// The lifetime of this object in the cache is infinite
	public expiresIn = -1;

	public constructor(settings: HackathonSettingsInterface) {
		this.id = 0;
		this.settings = settings;
	}
}
