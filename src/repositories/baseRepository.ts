import { Repository, Connection, getConnectionManager, ConnectionManager } from "typeorm";
import { injectable, unmanaged, decorate } from "inversify";

// First decorate the TypeORM base class repository with the injectable() annotation to prevent this error:
// Error: Missing required @injectable annotation in: Repository
decorate(injectable(), Repository);

@injectable()
export class BaseRepository<T> {
  public readonly repository: Repository<T>;

  constructor(@unmanaged() type: { new (): T }) {
    const connectionManager: ConnectionManager = getConnectionManager();
    if (connectionManager.connections.length > 0) {
      this.repository = connectionManager.get("applications").getRepository<T>(type);
    } else {
      throw "Connection to the database is not setup!";
    }
  }
}