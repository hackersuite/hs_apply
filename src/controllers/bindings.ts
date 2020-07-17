import { ContainerModule, interfaces } from 'inversify';
import { ApplicationControllerInterface, ApplicationController } from './applicationController';
import { TYPES } from '../types';
import { DashboardControllerInterface, DashboardController } from './dashboardController';
import { AdminControllerInterface, AdminController } from './adminController';
import { InviteController, InviteControllerInterface } from './inviteController';
import { ReviewControllerInterface, ReviewController } from './reviewController';

const controllers = new ContainerModule(
	(
		bind: interfaces.Bind
	) => {
		bind<AdminControllerInterface>(TYPES.AdminController).to(AdminController);

		bind<ApplicationControllerInterface>(TYPES.ApplicationController).to(ApplicationController);

		bind<DashboardControllerInterface>(TYPES.DashboardController).to(DashboardController);

		bind<InviteControllerInterface>(TYPES.InviteController).to(InviteController);

		bind<ReviewControllerInterface>(TYPES.ReviewController).to(ReviewController);
	}
);

export default controllers;
