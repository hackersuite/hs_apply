/* eslint-disable no-duplicate-imports */
/* This rule has been disabled as the imports are done logically */

import { Container } from 'inversify';
import { TYPES } from './types';

// Applicants
import { ApplicantServiceInterface, ApplicantService } from './services';
import { ApplicationControllerInterface, ApplicationController } from './controllers';
import { ApplicantRepository } from './repositories';

// Dashboard
import { DashboardControllerInterface, DashboardController } from './controllers';

// Admin
import { AdminControllerInterface, AdminController } from './controllers';

// Review
import { ReviewService } from './services';
import { ReviewController } from './controllers';
import { ReviewRepository } from './repositories';

// Email
import { EmailServiceInterface, EmailService } from './services';
import { InviteControllerInterface, InviteController } from './controllers';

// Cloud Storage
import { CloudStorageServiceInterface, CloudStorageService } from './services';

// Routers
import { RouterInterface, ApplicationRouter, DashboardRouter, InviteRouter, AdminRouter, ReviewRouter } from './routes';
import { CacheInterface, Cache } from './util/cache';
import { RequestAuthenticationInterface, RequestAuthentication } from './util/auth';

// SettingLoader
import { SettingLoaderInterface, SettingLoader } from './util/fs';

const container = new Container();

// Routers
container.bind<RouterInterface>(TYPES.Router).to(ApplicationRouter);
container.bind<RouterInterface>(TYPES.Router).to(DashboardRouter);
container.bind<RouterInterface>(TYPES.Router).to(AdminRouter);
container.bind<RouterInterface>(TYPES.Router).to(InviteRouter);
container.bind<RouterInterface>(TYPES.Router).to(ReviewRouter);

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

// Reviews
container.bind<ReviewController>(TYPES.ReviewController).to(ReviewController);
container.bind<ReviewService>(TYPES.ReviewService).to(ReviewService);
container.bind<ReviewRepository>(TYPES.ReviewRepository).to(ReviewRepository);

// Cloud Storage Service
container.bind<CloudStorageServiceInterface>(TYPES.CloudStorageService).to(CloudStorageService);

// Request Authentication
container.bind<RequestAuthenticationInterface>(TYPES.RequestAuthentication).to(RequestAuthentication);

// SettingLoader
container.bind<SettingLoaderInterface>(TYPES.SettingLoader).to(SettingLoader);

// Constants
container.bind<CacheInterface>(TYPES.Cache).toConstantValue(new Cache());

export default container;
