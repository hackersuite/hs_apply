import { Container } from "inversify";
import { TYPES } from "./types";

// Applicants
import { ApplicantServiceInterface, ApplicantService } from "./services";
import { ApplicationControllerInterface, ApplicationController } from "./controllers";
import { ApplicantRepository } from "./repositories";

// Dashboard
import { DashboardControllerInterface, DashboardController } from "./controllers";

// Admin
import { AdminControllerInterface, AdminController } from "./controllers";

// Email
import { EmailServiceInterface, EmailService } from "./services";
import { InviteControllerInterface, InviteController } from "./controllers";

// Routers
import { RouterInterface, ApplicationRouter, DashboardRouter, InviteRouter, AdminRouter } from "./routes";
import { CacheInterface, Cache } from "./util/cache";
import { RequestAuthenticationInterface, RequestAuthentication } from "./util/auth";

const container = new Container();

// Routers
container.bind<RouterInterface>(TYPES.Router).to(ApplicationRouter);
container.bind<RouterInterface>(TYPES.Router).to(DashboardRouter);
container.bind<RouterInterface>(TYPES.Router).to(AdminRouter);
container.bind<RouterInterface>(TYPES.Router).to(InviteRouter);

// Applications
container.bind<ApplicantServiceInterface>(TYPES.ApplicantService).to(ApplicantService);
container.bind<ApplicationControllerInterface>(TYPES.ApplicationController).to(ApplicationController);
container.bind<ApplicantRepository>(TYPES.ApplicantRepository).to(ApplicantRepository);

// Dashboard
container.bind<DashboardControllerInterface>(TYPES.DashboardController).to(DashboardController);

// Admin
container.bind<AdminControllerInterface>(TYPES.AdminController).to(AdminController);

// Email
container.bind<InviteControllerInterface>(TYPES.InviteController).to(InviteController);
container.bind<EmailServiceInterface>(TYPES.EmailService).to(EmailService);

// Request Authentication
container.bind<RequestAuthenticationInterface>(TYPES.RequestAuthentication).to(RequestAuthentication);

// Constants
container.bind<CacheInterface>(TYPES.Cache).toConstantValue(new Cache());

export default container;
