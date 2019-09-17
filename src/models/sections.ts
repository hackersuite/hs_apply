import { Cacheable } from "../util/cache";
import { IApplicationSection } from "../settings";

export class Sections implements Cacheable {
  id: number;
  sections: Array<IApplicationSection>;

  // The lifetime of this object in the cache is infinite
  expiresIn: number = -1;

  constructor(sections: Array<IApplicationSection>) {
    this.id = 0;
    this.sections = sections;
  }
}