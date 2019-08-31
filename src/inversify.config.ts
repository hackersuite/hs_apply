import { Container } from "inversify";
import { TYPES } from "./types";

// Applicants
import { IApplicationService, ApplicationService } from "./services";
import { IApplicationRepository, ApplicationRepository } from "./repositories";

import { IRouter, HomeRouter } from "./routes";

import { ICache, Cache } from "./util/cache";
import { ApplicationController } from "./controllers";

const container = new Container();
container.bind<IRouter>(TYPES.Router).to(HomeRouter);

container.bind<IApplicationService>(TYPES.ApplicationService).to(ApplicationService);
container.bind<IApplicationRepository>(TYPES.ApplicationRepository).to(ApplicationRepository);

container.bind<ApplicationController>(TYPES.ApplicationController).to(ApplicationController);

container.bind<ICache>(TYPES.Cache).toConstantValue(new Cache());

export default container;
