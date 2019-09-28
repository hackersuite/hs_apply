import { Cacheable } from "../util/cache";
import { IHackathonSettings } from "../settings";

export class HackathonSettings implements Cacheable {
  id: number;
  settings: IHackathonSettings;

  // The lifetime of this object in the cache is infinite
  expiresIn: number = -1;

  constructor(settings: IHackathonSettings) {
    this.id = 0;
    this.settings = settings;
  }
}