import { Cacheable } from '../util/cache';
import { ApplicationSectionInterface } from '../settings';

export class Sections implements Cacheable {
	public id: number;
	public sections: Array<ApplicationSectionInterface>;

	// The lifetime of this object in the cache is infinite
	public expiresIn = -1;

	public constructor(sections: Array<ApplicationSectionInterface>) {
		this.id = 0;
		this.sections = sections;
	}
}
