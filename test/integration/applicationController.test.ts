import test from "ava";
import * as request from "supertest";
import { App } from "../../src/app";
import { Express, NextFunction } from "express";
import { initEnv, getTestDatabaseOptions } from "../util/testUtils";
import { HttpResponseCode } from "../../src/util/errorHandling";
import { instance, mock, when, reset, anything, objectContaining, anyOfClass } from "ts-mockito";
import container from "../../src/inversify.config";
import { TYPES } from "../../src/types";
import { Cache } from "../../src/util/cache";
import { ApplicantService } from "../../src/services";
import { Sections } from "../../src/models/sections";
import { Applicant } from "../../src/models/db";
import { RequestAuthentication } from "../../src/util/auth";
import { SettingLoader } from "../../src/util/fs/loader";
import { AuthLevels } from "../../src/util/auth/authLevels";
import { ApplicantStatus } from "../../src/services/applications/applicantStatus";

let bApp: Express;
let mockCache: Cache;
let mockApplicantService: ApplicantService;
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
  hearAbout: "Other"
};
const testApplicant: Applicant = new Applicant();
testApplicant.age = 20;
testApplicant.gender = "Test";
testApplicant.nationality = "UK";
testApplicant.country = "UK";
testApplicant.city = "Manchester";
testApplicant.university = "UoM";
testApplicant.yearOfStudy = "Foundation";
testApplicant.workArea = "This";
testApplicant.hackathonCount = 0;
testApplicant.skills = testApplicant.whyChooseHacker = testApplicant.pastProjects = testApplicant.hardwareRequests = undefined;
testApplicant.dietaryRequirements = "Test";
testApplicant.tShirtSize = "M";
testApplicant.hearAbout = "Other";

const requestUser = {
  name: "Test",
  email: "test@test.com",
  authId: "010101",
  authLevel: AuthLevels.Organizer
};

const getUniqueApplicant = (): { applicantRequest: any; applicant: Applicant } => {
  // Create a unique applicant using current time
  const applicantIdentifier = new Date().getTime().toString();
  const applicant: Applicant = { ...testApplicant, city: applicantIdentifier };
  const applicantRequest = { ...newApplicantRequest, city: applicantIdentifier };

  // Add fields that are added in the controller
  applicant.authId = requestUser.authId;
  applicant.applicationStatus = ApplicantStatus.Applied;

  return { applicantRequest, applicant };
};

test.before.cb(t => {
  initEnv();
  mockCache = mock(Cache);
  mockApplicantService = mock(ApplicantService);
  mockRequestAuth = mock(RequestAuthentication);
  mockSettingLoader = mock(SettingLoader);

  container.rebind(TYPES.RequestAuthentication).toConstantValue(instance(mockRequestAuth));
  container.rebind(TYPES.Cache).toConstantValue(instance(mockCache));
  container.rebind(TYPES.ApplicantService).toConstantValue(instance(mockApplicantService));
  container.rebind(TYPES.SettingLoader).toConstantValue(instance(mockSettingLoader));

  when(mockRequestAuth.passportSetup).thenReturn(() => null);
  when(mockRequestAuth.checkLoggedIn).thenReturn((req, res, next: NextFunction) => {
    req.user = requestUser;
    next();
  });
  when(mockRequestAuth.checkIsOrganizer).thenReturn((req, res, next: NextFunction) => {
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
  reset(mockApplicantService);

  // Restore to last snapshot so each unit test takes a clean copy of the application container
  container.restore();
});

test.serial("Test application page loads, applications open, no application submitted", async t => {
  // Mock out the cache and question loader
  when(mockCache.getAll(Sections.name)).thenReturn([new Sections([])]);
  when(mockApplicantService.findOne(anything(), anything())).thenResolve(undefined);

  // Perform the request along /apply
  const response = await request(bApp).get("/apply");

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test.serial("Test application page redirects, applications open, application submitted", async t => {
  // Mock out the cache and question loader
  when(mockCache.getAll(Sections.name)).thenReturn([new Sections([])]);
  when(mockApplicantService.findOne(anything(), anything())).thenResolve(new Applicant());

  // Perform the request along /apply
  const response = await request(bApp).get("/apply");

  // Check that we get a REDIRECT (302) response code
  t.is(response.status, HttpResponseCode.REDIRECT);
});

// test.serial("Test application page redirects, applications closed", async t => {
//   // Mock out the cache and question loader
//   when(mockCache.getAll(Sections.name)).thenReturn([new Sections([])]);
//   const requestApp = bApp;
//   requestApp.locals.settings["applicationsClose"] = new Date(Date.now()).toString();

//   // Perform the request along /apply
//   const response = await request(requestApp).get("/apply");

//   // Check that we get a REDIRECT (302) response code
//   verify(mockApplicantService.findOne(requestUser.authId, "authId")).never();
//   t.is(response.status, HttpResponseCode.REDIRECT);
// });

test("Test applicant created with valid request, applications open", async t => {
  const { applicantRequest, applicant } = getUniqueApplicant();
  when(mockApplicantService.save(objectContaining(applicant), undefined)).thenResolve(applicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .send({ applicantRequest });

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test("Test applicant created with valid request (using Other input options)", async t => {
  const workArea = "Testtt";
  const { applicantRequest, applicant } = getUniqueApplicant();
  applicant.workArea = workArea;

  when(mockApplicantService.save(objectContaining(applicant), undefined)).thenResolve(applicant);

  // Perform the request along /apply
  const response = await request(bApp)
    .post("/apply")
    .send({
      ...applicantRequest,
      workArea: "Other",
      workAreaOther: workArea
    });

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test("Test applicant created with valid request (with no Other input provided)", async t => {
  const { applicantRequest, applicant } = getUniqueApplicant();
  applicant.gender = "Other";
  when(mockApplicantService.save(objectContaining(applicant), undefined)).thenResolve(applicant);

  // Perform the request along .../apply
  // When the user has selected "Other" in the application and not provided anything, default to "Other"
  const response = await request(bApp)
    .post("/apply")
    .send({
      ...applicantRequest,
      gender: undefined,
      genderOther: undefined
    });

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test("Test applicant not created with invalid input", async t => {
  const { applicantRequest, applicant } = getUniqueApplicant();
  // Mock out the application save call in the service
  when(mockApplicantService.save(objectContaining(applicant), undefined)).thenReject(new Error(""));

  // Perform the post request along /apply
  const response = await request(bApp)
    .post("/apply")
    .send(applicantRequest);

  // Check that we get a BAD_REQUEST (400) response code
  t.is(response.status, HttpResponseCode.BAD_REQUEST);
  t.is(response.body.error, true);
});

test("Test applicant not created with cv too large", async t => {
  // Perform the request along /apply
  const response = await request(bApp)
    .post("/apply")
    .attach("cv", Buffer.alloc(5 * (1 << 21)), { filename: "cv.pdf", contentType: "application/pdf" }) // Create buffer of >5MB
    .field(newApplicantRequest);

  // Check that we get a BAD_REQUEST (400) response code
  t.is(response.status, HttpResponseCode.BAD_REQUEST);
  t.is(response.body.error, true);
  t.is(response.body.message, "File too large");
});

test("Test applicant not created with unsupported cv format", async t => {
  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .attach("cv", Buffer.from(""), { filename: "cv.txt" })
    .field(newApplicantRequest);

  // Check that we get a BAD_REQUEST (400) response code
  t.is(response.status, HttpResponseCode.BAD_REQUEST);
  t.is(response.body.error, true);
  t.is(response.body.message, "Unsupported file format");
});

test("Test applicant created with doc cv", async t => {
  const cvFile: Buffer = Buffer.from("");
  const { applicantRequest, applicant } = getUniqueApplicant();
  when(mockApplicantService.save(objectContaining(applicant), anyOfClass(Buffer))).thenResolve(applicant);

  // Perform the request along /apply
  const response = await request(bApp)
    .post("/apply")
    .attach("cv", cvFile, { filename: "cv.doc" })
    .field(applicantRequest);

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test("Test applicant created with pdf cv", async t => {
  const cvFile: Buffer = Buffer.from("");
  const { applicantRequest, applicant } = getUniqueApplicant();
  when(mockApplicantService.save(objectContaining(applicant), anyOfClass(Buffer))).thenResolve(applicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .attach("cv", cvFile, "cv.pdf")
    .field(applicantRequest);

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test("Test applicant created with docx cv", async t => {
  const cvFile: Buffer = Buffer.from("");
  const { applicantRequest, applicant } = getUniqueApplicant();
  when(mockApplicantService.save(objectContaining(applicant), anyOfClass(Buffer))).thenResolve(applicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .attach("cv", cvFile, "cv.docx")
    .field(applicantRequest);

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});
