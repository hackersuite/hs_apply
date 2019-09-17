import test from "ava";
import { Express } from "express";
import { App } from "../../src/app";
import { getConnection } from "typeorm";
import { getTestDatabaseOptions, initEnv } from "../util/testUtils";

/**
 * Setup the env variables for the tests
 */
test.before((): void => {
  initEnv();
});

/**
 * Building app with default settings
 */
test.serial.cb("App should build without errors", t => {
  new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
    t.is(err, undefined);
    t.is(builtApp.get("port"), process.env.PORT || 3000);
    t.is(builtApp.get("env"), process.env.ENVIRONMENT || "production");
    t.truthy(getConnection("applications").isConnected);
    await getConnection("applications").close();
    t.end();
  }, getTestDatabaseOptions());
});

/**
 * Testing dev environment
 */
test.serial.cb("App should start in dev environment", t => {
  process.env.ENVIRONMENT = "dev";
  new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
    t.is(builtApp.get("env"), "dev");
    t.is(err, undefined);
    t.truthy(getConnection("applications").isConnected);
    await getConnection("applications").close();
    t.end();
  }, getTestDatabaseOptions());
});

/**
 * Testing production environment
 */
test.serial.cb("App should start in production environment", t => {
  process.env.ENVIRONMENT = "production";
  new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
    t.is(builtApp.get("env"), "production");
    t.is(builtApp.get("trust proxy"), 1);
    t.is(err, undefined);
    t.truthy(getConnection("applications").isConnected);
    await getConnection("applications").close();
    t.end();
  }, getTestDatabaseOptions());
});

/**
 * Testing error handling with incorrect settings
 */
test.serial.cb("App should throw error with invalid settings", t => {
  process.env.DB_HOST = "invalidhost";
  new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
    t.truthy(err);
    t.falsy(getConnection("applications").isConnected);
    t.end();
  });
});