import test from "ava";
import * as request from "supertest";
import { App } from "../../src/app";
import { Express, NextFunction } from "express";
import { initEnv, getTestDatabaseOptions } from "../util/testUtils";
import { HttpResponseCode } from "../../src/util/errorHandling";
import { instance, mock, reset, when, anything } from "ts-mockito";
import container from "../../src/inversify.config";
import { TYPES } from "../../src/types";
import { Cache } from "../../src/util/cache";
import { RequestAuthentication, SettingLoader } from "../../src/util";
import { AuthLevels } from "../../src/util/auth/authLevels";

let bApp: Express;
let mockCache: Cache;
let mockRequestAuth: RequestAuthentication;
let mockSettingLoader: SettingLoader;

const requestUser = {
  name: "Test",
  email: "test@test.com",
  authId: "010101",
  authLevel: AuthLevels.Organizer
};

test.before.cb(t => {
  initEnv();
  mockCache = mock(Cache);
  mockRequestAuth = mock(RequestAuthentication);
  mockSettingLoader = mock<SettingLoader>();

  container.rebind(TYPES.RequestAuthentication).toConstantValue(instance(mockRequestAuth));
  container.rebind(TYPES.Cache).toConstantValue(instance(mockCache));
  container.rebind(TYPES.SettingLoader).toConstantValue(instance(mockSettingLoader));

  when(mockRequestAuth.passportSetup(bApp)).thenReturn();
  when(mockRequestAuth.checkLoggedIn(anything(), anything(), anything())).thenCall((req, res, next: NextFunction) => {
    req.user = requestUser;
    next();
  });
  when(mockSettingLoader.loadApplicationSettings(anything())).thenCall((app: Express) => {
    app.locals.settings = {
      shortName: "Hackathon",
      fullName: "Hackathon",
      applicationsOpen: new Date().toString(),
      applicationsClose: new Date(Date.now() + 10800 * 1000).toString() // 3 hours from now
    };
  });

  new App().buildApp(async (builtApp: Express, err: Error): Promise<void> => {
    if (err) {
      throw Error("Failed to setup test");
    } else {
      bApp = builtApp;
      t.end();
    }
  }, getTestDatabaseOptions());
});

test.beforeEach(() => {
  // Create a snapshot so each unit test can modify it without breaking other unit tests
  container.snapshot();
});

test.afterEach(() => {
  // Reset the mocks
  reset(mockCache);

  // Restore to last snapshot so each unit test takes a clean copy of the container
  container.restore();
});

test("Test the dashboard page loads", async t => {
  // Perform the request along .../
  const response = await request(bApp).get("/");

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});
