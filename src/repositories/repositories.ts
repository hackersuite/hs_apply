import { provide } from 'inversify-binding-decorators';
import { Repository, ObjectLiteral, EntityManager, ObjectType } from 'typeorm';
import { decorate, injectable } from 'inversify';
import { getEntityManagerOrTransactionManager } from 'typeorm-transactional-cls-hooked';

// First decorate the TypeORM base class repository with the injectable() annotation to prevent this error:
// Error: Missing required @injectable annotation in: Repository
decorate(injectable(), Repository);

@injectable()
class TransactionRepository<Entity extends ObjectLiteral> extends Repository<Entity> {
	private _connectionName = 'default';
	private _manager: EntityManager | undefined;

	public set manager(manager: EntityManager) {
		this._manager = manager;
		this._connectionName = manager.connection.name;
	}

	// Always get the entityManager from the cls namespace if active, otherwise, use the original or getManager(connectionName)
	public get manager(): EntityManager {
		return getEntityManagerOrTransactionManager(this._connectionName, this._manager);
	}
}

@provide(InjectedRepository)
export class InjectedRepository<T> extends TransactionRepository<T> {
	public getRepository(type: ObjectType<T>): Repository<T> {
		return super.manager.getRepository(type.name);
	}
}
