import { Repository, Connection, getConnectionManager, ConnectionManager } from "typeorm";
import { injectable, unmanaged, decorate } from "inversify";
import { Applicant } from "../models/db";

// First decorate the TypeORM base class repository with the injectable() annotation to prevent this error:
// Error: Missing required @injectable annotation in: Repository
decorate(injectable(), Repository);

@injectable()
export class BaseRepository<T> {
  protected connect(type: { new (): T }): Repository<T> {
    let repository: Repository<T>;
    const connectionManager: ConnectionManager = getConnectionManager();
    if (connectionManager.connections.length > 0) {
      repository = connectionManager.get("applications").getRepository<T>(type);
    } else {
      throw "Connection to the database is not setup!";
    }
    return repository;
  }
}