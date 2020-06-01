import { when, mock, instance, anything } from "ts-mockito";
import { Express, NextFunction, Request, Response } from "express";
import { initEnv } from "../../../util";
import { SettingLoader, RequestAuthenticationInterface } from "../../../../src/util";
import { AuthLevels } from "@unicsmcr/hs_auth_client";
import container from "../../../../src/inversify.config";
import { TYPES } from "../../../../src/types";
import { RequestAuthentication } from "../../../../src/util";
import { Cache } from "../../../../src/util/cache";
import { ApplicantService } from "../../../../src/services";
import { getCurrentUser as authUserReq } from "@unicsmcr/hs_auth_client";

let mockCache: Cache;
let mockSettingLoader: SettingLoader;
let mockApplicantService: ApplicantService;
let requestAuth: RequestAuthentication;

const requestUser = {
  name: "Test",
  email: "test@test.com",
  authId: "010101",
  authLevel: AuthLevels.Organiser
};

beforeAll(() => {
  initEnv();
  mockCache = mock(Cache);
  mockSettingLoader = mock(SettingLoader);
  mockApplicantService = mock(ApplicantService);

  container.rebind(TYPES.Cache).toConstantValue(instance(mockCache));
  container.rebind(TYPES.SettingLoader).toConstantValue(instance(mockSettingLoader));
  container.rebind(TYPES.ApplicantService).toConstantValue(instance(mockApplicantService));

  when(mockSettingLoader.loadApplicationSettings(anything())).thenCall((app: Express) => {
    app.locals.settings = {
      shortName: "Hackathon",
      fullName: "Hackathon",
      applicationsOpen: new Date().toString(),
      applicationsClose: new Date(Date.now() + 10800 * 1000).toString() // 3 hours from now
    };
  });

  requestAuth = container.get<RequestAuthenticationInterface>(TYPES.RequestAuthentication) as RequestAuthentication;

  // new App().buildApp((builtApp: Express, err: Error): void => {
  //   if (err) {
  //     done(err.message + "\n" + err.stack);
  //   } else {
  //     bApp = builtApp;
  //     done();
  //   }
  // }, getTestDatabaseOptions());
});

let reqMock: Request = mock<Request>();
let resMock: Response = mock<Response>();
let nextFunctionMock: jest.Mock<NextFunction> = jest.fn();
beforeEach(() => {
  reqMock = mock<Request>();
  resMock = mock<Response>();
  nextFunctionMock = jest.fn();
});

describe("Check Auth Level tests", () => {
  describe("Auth level valid", () => {
    test("Test organiser is authenticated as such, not redirected", async () => {
      // Setup the user in the request
      reqMock.user = { ...requestUser, authLevel: AuthLevels.Organiser };

      // Make the function call to check the users authentication level
      requestAuth.checkIsOrganiser(reqMock, resMock, nextFunctionMock);

      expect(resMock.locals.isOrganiser).toBeTruthy();
      expect(resMock.locals.isVolunteer).toBeTruthy();
      expect(nextFunctionMock.mock.calls.length).toBe(1);
    });

    test("Test volunteer is authenticated as such, not redirected", async () => {
      // Setup the user in the request
      reqMock.user = { ...requestUser, authLevel: AuthLevels.Volunteer };

      // Make the function call to check the users authentication level
      requestAuth.checkIsVolunteer(reqMock, resMock, nextFunctionMock);

      expect(resMock.locals.isOrganiser).toBeFalsy();
      expect(resMock.locals.isVolunteer).toBeTruthy();
      expect(nextFunctionMock.mock.calls.length).toBe(1);
    });

    test("Test attendee is authenticated as such, not redirected", async () => {
      // Setup the user in the request
      reqMock.user = { ...requestUser, authLevel: AuthLevels.Attendee };

      // Make the function call to check the users authentication level
      requestAuth.checkIsAttendee(reqMock, resMock, nextFunctionMock);

      expect(resMock.locals.isOrganiser).toBeFalsy();
      expect(resMock.locals.isVolunteer).toBeFalsy();
      expect(resMock.locals.isAttendee).toBeTruthy();
      expect(nextFunctionMock.mock.calls.length).toBe(1);
    });
  });

  describe("Auth level invalid", () => {
    test("Test request as attendee fails when lower auth level", async () => {
      // Setup the user in the request
      reqMock.user = { ...requestUser, authLevel: AuthLevels.Unverified };
      resMock.redirect = jest.fn();

      // Make the function call to check the users authentication level
      requestAuth.checkIsAttendee(reqMock, resMock, nextFunctionMock);

      expect(resMock.locals.isOrganiser).toBeFalsy();
      expect(resMock.locals.isVolunteer).toBeFalsy();
      expect(resMock.locals.isAttendee).toBeFalsy();
      expect(nextFunctionMock.mock.calls.length).toBe(0);
      expect((resMock.redirect as jest.Mock).mock.calls.length).toBe(1);
    });

    test("Test request as volunteer fails when lower auth level", async () => {
      // Setup the user in the request
      reqMock.user = { ...requestUser, authLevel: AuthLevels.Attendee };
      resMock.redirect = jest.fn();

      // Make the function call to check the users authentication level
      requestAuth.checkIsVolunteer(reqMock, resMock, nextFunctionMock);

      expect(resMock.locals.isOrganiser).toBeFalsy();
      expect(resMock.locals.isVolunteer).toBeFalsy();
      expect(resMock.locals.isAttendee).toBeFalsy();
      expect(nextFunctionMock.mock.calls.length).toBe(0);
      expect((resMock.redirect as jest.Mock).mock.calls.length).toBe(1);
    });

    test("Test request as organiser fails when lower auth level", async () => {
      // Setup the user in the request
      reqMock.user = { ...requestUser, authLevel: AuthLevels.Volunteer };
      resMock.redirect = jest.fn();

      // Make the function call to check the users authentication level
      requestAuth.checkIsOrganiser(reqMock, resMock, nextFunctionMock);

      expect(resMock.locals.isOrganiser).toBeFalsy();
      expect(resMock.locals.isVolunteer).toBeFalsy();
      expect(resMock.locals.isAttendee).toBeFalsy();
      expect(nextFunctionMock.mock.calls.length).toBe(0);
      expect((resMock.redirect as jest.Mock).mock.calls.length).toBe(1);
    });
  });

  describe("User not defined in check auth level", () => {
    test("Test request redirected when user not valid", async () => {
      // Setup the user in the request
      reqMock.user = undefined;
      resMock.redirect = jest.fn();

      // Make the function call to check the users authentication level
      requestAuth.checkIsOrganiser(reqMock, resMock, nextFunctionMock);

      expect(resMock.locals.isOrganiser).toBeFalsy();
      expect(resMock.locals.isVolunteer).toBeFalsy();
      expect(resMock.locals.isAttendee).toBeFalsy();
      expect(nextFunctionMock.mock.calls.length).toBe(0);
      expect((resMock.redirect as jest.Mock).mock.calls.length).toBe(1);
    });
  });
});

jest.mock("@unicsmcr/hs_auth_client");
describe("Check logged in tests", () => {
  const mockGetCurrentUserRequest = authUserReq as jest.Mock;

  test("User logged in and auth level verfied with valid request", done => {
    mockGetCurrentUserRequest.mockImplementation(() => Promise.resolve(requestUser));

    function callback(): void {
      try {
        expect(reqMock.user).toBe(requestUser);
        expect(mockGetCurrentUserRequest).toHaveBeenCalledTimes(1);
        done();
      } catch (error) {
        done(error);
      }
    }
    reqMock.cookies["Authorization"] = "test_cookie";
    requestAuth.passportSetup(mock<Express>());
    requestAuth.checkLoggedIn(reqMock, resMock, callback);
  });

  test("User redirected when user is not authenticated", done => {
    // Test setup for creating mock implementation of getCurrentUser API request
    const getCurrentUserRejectError = new Error("MockFuncError");
    mockGetCurrentUserRequest.mockRejectedValue(getCurrentUserRejectError);

    // Test setup for creating a mock of the redirect function we can spy on
    resMock.redirect = jest.fn();

    function callback(): void {
      try {
        // Verify that the auth request failed and we are redirected to login
        expect(mockGetCurrentUserRequest).rejects.toBe(getCurrentUserRejectError);
        expect((resMock.redirect as jest.Mock).mock.calls.length).toBe(1);
        expect(resMock.locals.authLevel).toBeFalsy();

        // End the test successfully
        done();
      } catch (error) {
        done(error);
      }
    }

    // Perform the test
    requestAuth.passportSetup(mock<Express>());
    requestAuth.checkLoggedIn(reqMock, resMock, callback);
  });

  afterAll(() => {
    jest.unmock("@unicsmcr/hs_auth_client");
  });
});
