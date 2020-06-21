import * as request from "supertest";
import { App } from "../../../src/app";
import { Express, NextFunction } from "express";
import { initEnv, getTestDatabaseOptions } from "../../util/testUtils";
import { HttpResponseCode } from "../../../src/util/errorHandling";
import { instance, mock, reset, when, anything } from "ts-mockito";
import container from "../../../src/inversify.config";
import { TYPES } from "../../../src/types";
import { Cache } from "../../../src/util/cache";
import { RequestAuthentication, SettingLoader } from "../../../src/util";
import { AuthLevel } from "@unicsmcr/hs_auth_client";

let bApp: Express;
let mockCache: Cache;
let mockRequestAuth: RequestAuthentication;
let mockSettingLoader: SettingLoader;

const requestUser = {
  name: "Test",
  email: "test@test.com",
  id: "010101",
  authLevel: AuthLevel.Organiser
};

beforeAll(done => {
  initEnv();
  mockCache = mock(Cache);
  mockRequestAuth = mock(RequestAuthentication);
  mockSettingLoader = mock(SettingLoader);

  container.rebind(TYPES.RequestAuthentication).toConstantValue(instance(mockRequestAuth));
  container.rebind(TYPES.Cache).toConstantValue(instance(mockCache));
  container.rebind(TYPES.SettingLoader).toConstantValue(instance(mockSettingLoader));

  when(mockRequestAuth.passportSetup).thenReturn(() => null);
  when(mockRequestAuth.checkLoggedIn).thenReturn(async (req, res, next: NextFunction) => {
    req.user = requestUser;
    next();
  });
  when(mockRequestAuth.checkIsOrganiser).thenReturn((req, res, next: NextFunction) => {
    next();
  });
  when(mockRequestAuth.checkIsVolunteer).thenReturn((req, res, next: NextFunction) => {
    next();
  });
  when(mockRequestAuth.checkIsAttendee).thenReturn((req, res, next: NextFunction) => {
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

  new App().buildApp((builtApp: Express, err: Error): void => {
    if (err) {
      done(err.message + "\n" + err.stack);
    } else {
      bApp = builtApp;
      done();
    }
  }, getTestDatabaseOptions());
});

beforeEach(() => {
  // Create a snapshot so each unit test can modify it without breaking other unit tests
  container.snapshot();
});

afterEach(() => {
  // Reset the mocks
  reset(mockCache);

  // Restore to last snapshot so each unit test takes a clean copy of the container
  container.restore();
});

test("Test the dashboard page loads", async () => {
  // Perform the request along .../
  const response = await request(bApp).get("/");

  // Check that we get a OK (200) response code
  expect(response.status).toBe(HttpResponseCode.OK);
});
