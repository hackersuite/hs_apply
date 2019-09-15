import { Container } from "inversify";
import { TYPES } from "./types";

// Applicants
import { IApplicantService, ApplicantService } from "./services";
import { IApplicationController, ApplicationController } from "./controllers";
import { ApplicantRepository } from "./repositories";

// Dashboard
import { IDashboardController, DashboardController } from "./controllers";

import { IRouter, ApplicationRouter, DashboardRouter } from "./routes";
import { ICache, Cache } from "./util/cache";

const container = new Container();

// Routers
container.bind<IRouter>(TYPES.Router).to(ApplicationRouter);
container.bind<IRouter>(TYPES.Router).to(DashboardRouter);

// Applications
container.bind<IApplicantService>(TYPES.ApplicantService).to(ApplicantService);
container.bind<IApplicationController>(TYPES.ApplicationController).to(ApplicationController);
container.bind<ApplicantRepository>(TYPES.ApplicantRepository).to(ApplicantRepository);

// Dashboard
container.bind<IDashboardController>(TYPES.DashboardController).to(DashboardController);

container.bind<ICache>(TYPES.Cache).toConstantValue(new Cache());

export default container;
