import { Container } from "inversify";
import { TYPES } from "./types";

// Applicants
import { IApplicantService, ApplicantService } from "./services";
import { IApplicationController, ApplicationController } from "./controllers";
import { ApplicantRepository } from "./repositories";

// Dashboard
import { IDashboardController, DashboardController } from "./controllers";

// Admin
import { IAdminController, AdminController } from "./controllers";

// Email
import { IEmailService, EmailService } from "./services";
import { IInviteController, InviteController } from "./controllers";

// Routers
import { IRouter, ApplicationRouter, DashboardRouter, InviteRouter, AdminRouter } from "./routes";
import { ICache, Cache } from "./util/cache";
import { IRequestAuthentication, RequestAuthentication } from "./util/auth";

const container = new Container();

// Routers
container.bind<IRouter>(TYPES.Router).to(ApplicationRouter);
container.bind<IRouter>(TYPES.Router).to(DashboardRouter);
container.bind<IRouter>(TYPES.Router).to(AdminRouter);
container.bind<IRouter>(TYPES.Router).to(InviteRouter);

// Applications
container.bind<IApplicantService>(TYPES.ApplicantService).to(ApplicantService);
container.bind<IApplicationController>(TYPES.ApplicationController).to(ApplicationController);
container.bind<ApplicantRepository>(TYPES.ApplicantRepository).to(ApplicantRepository);

// Dashboard
container.bind<IDashboardController>(TYPES.DashboardController).to(DashboardController);

// Admin
container.bind<IAdminController>(TYPES.AdminController).to(AdminController);

// Email
container.bind<IInviteController>(TYPES.InviteController).to(InviteController);
container.bind<IEmailService>(TYPES.EmailService).to(EmailService);

// Request Authentication
container.bind<IRequestAuthentication>(TYPES.RequestAuthentication).to(RequestAuthentication);

// Constants
container.bind<ICache>(TYPES.Cache).toConstantValue(new Cache());

export default container;
