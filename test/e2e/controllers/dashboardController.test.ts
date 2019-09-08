import test from "ava";
import * as request from "supertest";
import { App } from "../../../src/app";
import { Express } from "express";
import { initEnv, getTestDatabaseOptions } from "../../util/testUtils";
import { HttpResponseCode } from "../../../src/util/errorHandling";
import { instance, mock, reset } from "ts-mockito";
import container from "../../../src/inversify.config";
import { TYPES } from "../../../src/types";
import { Cache } from "../../../src/util/cache";

let bApp: Express;
let mockCache: Cache;

test.before.cb(t => {
  initEnv();
  mockCache = mock(Cache);
  container.rebind(TYPES.Cache).toConstantValue(instance(mockCache));

  new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
    if (err) {
      throw Error("Failed to setup test");
    } else {
      bApp = builtApp;
      t.end();
    }
  }, getTestDatabaseOptions());
});

test.beforeEach(t => {
  // Create a snapshot so each unit test can modify it without breaking other unit tests
  container.snapshot();
});

test.afterEach(t => {
  // Reset the mocks
  reset(mockCache);

  // Restore to last snapshot so each unit test takes a clean copy of the container
  container.restore();
});

test("Test the dashboard page loads", async t => {
  // Perform the request along .../
  const response = await request(bApp)
    .get("/");

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});