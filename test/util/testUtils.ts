import { Connection, createConnections, getConnection, ConnectionOptions } from "typeorm";

export async function createTestDatabaseConnection(entities?: (string | Function)[]): Promise<Connection> {
  const testConnection: Connection[] = await createConnections(getTestDatabaseOptions(entities));

  if (testConnection[0].isConnected)
    return testConnection[0];
  else
    throw new Error("Failed to create the testing database!");
}

export async function closeTestDatabaseConnection(name?: string): Promise<void> {
  await getConnection(name).dropDatabase();
  await getConnection(name).close();
}

export async function reloadTestDatabaseConnection(name?: string): Promise<void> {
  await getConnection(name).synchronize(true);
}

export function getTestDatabaseOptions(entities?: (string | Function)[], name?: string): ConnectionOptions[] {
  return [{
    name: name || "applications",
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    synchronize: true,
    logging: false,
    entities: entities || [
      __dirname + "/../../src/models/db/*{.js,.ts}"
    ]
  }];
}

export function initEnv(): void {
  process.env.SALT = "random";
  process.env.ITERATIONS = "30000";
  process.env.KEY_LENGTH = "32";
  process.env.DIGEST = "sha256";
  process.env.SESSION_SECRET = "cat";
  process.env.ENVIRONMENT = "dev";
}