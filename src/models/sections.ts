import { Cacheable } from "../util/cache";
import { ApplicationSectionInterface } from "../settings";

export class Sections implements Cacheable {
  id: number;
  sections: Array<ApplicationSectionInterface>;

  // The lifetime of this object in the cache is infinite
  expiresIn = -1;

  constructor(sections: Array<ApplicationSectionInterface>) {
    this.id = 0;
    this.sections = sections;
  }
}
