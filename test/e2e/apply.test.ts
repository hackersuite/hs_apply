import test from "ava";
import * as request from "supertest";
import { App } from "../../src/app";
import { Express, NextFunction } from "express";
import { initEnv, getTestDatabaseOptions } from "../util/testUtils";
import { HttpResponseCode } from "../../src/util/errorHandling";
import container from "../../src/inversify.config";
import { Applicant } from "../../src/models/db";
import { RequestAuthentication } from "../../src/util/auth";
import { SettingLoader } from "../../src/util/fs";
import { AuthLevels } from "@unicsmcr/hs_auth_client";
import { mock, instance, when, anything } from "ts-mockito";
import { TYPES } from "../../src/types";
import { Repository } from "typeorm";
import { ApplicantRepository } from "../../src/repositories";

let bApp: Express;
let applicantRepository: Repository<Applicant>;
let mockRequestAuth: RequestAuthentication;
let mockSettingLoader: SettingLoader;

const newApplicantRequest: any = {
  age: 20,
  gender: "Other",
  genderOther: "Test",
  nationality: "UK",
  country: "UK",
  city: "Manchester",
  university: "UoM",
  degree: "CS",
  yearOfStudy: "Foundation",
  workArea: "Other",
  workAreaOther: "This",
  hackathonCount: 0,
  dietaryRequirements: "Other",
  dietaryRequirementsOther: "Test",
  tShirtSize: "M",
  hearAbout: "IDK"
};

const testApplicant: Applicant = new Applicant();
testApplicant.age = 20;
testApplicant.gender = "Test";
testApplicant.nationality = "UK";
testApplicant.country = "UK";
testApplicant.city = "Manchester";
testApplicant.university = "UoM";
testApplicant.degree = "CS";
testApplicant.yearOfStudy = "Foundation";
testApplicant.workArea = "This";
testApplicant.hackathonCount = 0;
testApplicant.dietaryRequirements = "Test";
testApplicant.tShirtSize = "M";
testApplicant.hearAbout = "IDK";

const requestUser = {
  name: "Test",
  email: "test@test.com",
  authId: "010101",
  authLevel: AuthLevels.Organiser
};

test.before.cb(t => {
  initEnv();

  mockRequestAuth = mock(RequestAuthentication);
  mockSettingLoader = mock(SettingLoader);

  container.rebind(TYPES.RequestAuthentication).toConstantValue(instance(mockRequestAuth));
  container.rebind(TYPES.SettingLoader).toConstantValue(instance(mockSettingLoader));

  when(mockRequestAuth.passportSetup).thenReturn(() => null);
  when(mockRequestAuth.checkLoggedIn).thenReturn((req, res, next: NextFunction) => {
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
      t.end(err.message + "\n" + err.stack);
    } else {
      bApp = builtApp;

      // After the application has been built and db connection established -- get the applicant repository
      applicantRepository = container.get<ApplicantRepository>(TYPES.ApplicantRepository).getRepository();
      t.end();
    }
  }, getTestDatabaseOptions());
});

test.beforeEach(() => {
  // Create a snapshot so each unit test can modify it without breaking other unit tests
  container.snapshot();
});

test.afterEach(() => {
  // Restore to last snapshot so each unit test takes a clean copy of the application container
  container.restore();
});

test("Test 404 page provided when invalid URL", async t => {
  // Perform the request along .../apply
  const response = await request(bApp).get("/invalidpage-url-123");

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test("Test applicant created with valid request", async t => {
  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .send(newApplicantRequest);
  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);

  // Check that the application has been added to the database
  const createdApplicant: Applicant = await applicantRepository.findOne({ authId: requestUser.authId });
  t.is(createdApplicant.authId, requestUser.authId);
  t.is(createdApplicant.age, newApplicantRequest.age);
  t.is(createdApplicant.city, newApplicantRequest.city);
  t.is(createdApplicant.degree, newApplicantRequest.degree);
});
