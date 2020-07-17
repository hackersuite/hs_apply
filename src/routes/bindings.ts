import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../types';
import { RouterInterface, ApplicationRouter, DashboardRouter, AdminRouter, InviteRouter, ReviewRouter } from './index';

const routers = new ContainerModule(
	(
		bind: interfaces.Bind
	) => {
		bind<RouterInterface>(TYPES.Router).to(ApplicationRouter);
		bind<RouterInterface>(TYPES.Router).to(DashboardRouter);
		bind<RouterInterface>(TYPES.Router).to(AdminRouter);
		bind<RouterInterface>(TYPES.Router).to(InviteRouter);
		bind<RouterInterface>(TYPES.Router).to(ReviewRouter);
	}
);

export default routers;
