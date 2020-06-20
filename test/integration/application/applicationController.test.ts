import * as request from "supertest";
import { App } from "../../../src/app";
import { Express, NextFunction } from "express";
import { initEnv, getTestDatabaseOptions } from "../../util/testUtils";
import { HttpResponseCode } from "../../../src/util/errorHandling";
import { instance, mock, when, reset, anything, objectContaining, anyOfClass, verify } from "ts-mockito";
import container from "../../../src/inversify.config";
import { TYPES } from "../../../src/types";
import { Cache } from "../../../src/util/cache";
import { ApplicantService } from "../../../src/services";
import { Sections } from "../../../src/models/sections";
import { Applicant } from "../../../src/models/db";
import { RequestAuthentication } from "../../../src/util/auth";
import { SettingLoader } from "../../../src/util/fs/loader";
import { AuthLevel } from "@unicsmcr/hs_auth_client";
import { ApplicantStatus } from "../../../src/services/applications/applicantStatus";

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
  id: "010101",
  authLevel: AuthLevel.Organiser
};

const getUniqueApplicant = (options?: { needsID: boolean }): [any, Applicant] => {
  // Create a unique applicant using current time
  const applicantIdentifier = new Date().getTime().toString();
  const applicant: Applicant = { ...testApplicant, city: applicantIdentifier };
  const applicantRequest = { ...newApplicantRequest, city: applicantIdentifier };

  // Add fields that are added in the controller
  applicant.authId = requestUser.id;
  applicant.applicationStatus = ApplicantStatus.Applied;

  applicant.id = options?.needsID ? "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000" : undefined;

  return [applicantRequest, applicant];
};

beforeAll(done => {
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
  reset(mockApplicantService);

  // Restore to last snapshot so each unit test takes a clean copy of the application container
  container.restore();
});

test("Test application page loads, applications open, no application submitted", async () => {
  // Mock out the cache and question loader
  when(mockCache.getAll(Sections.name)).thenReturn([new Sections([])]);
  when(mockApplicantService.findOne(anything(), anything())).thenResolve(undefined);

  // Perform the request along /apply
  const response = await request(bApp).get("/apply");

  // Check that we get a OK (200) response code
  expect(response.status).toBe(HttpResponseCode.OK);
});

test("Test application page redirects, applications open, application submitted", async () => {
  // Mock out the cache and question loader
  when(mockCache.getAll(Sections.name)).thenReturn([new Sections([])]);
  when(mockApplicantService.findOne(anything(), anything())).thenResolve(new Applicant());

  // Perform the request along /apply
  const response = await request(bApp).get("/apply");

  // Check that we get a REDIRECT (302) response code
  expect(response.status).toBe(HttpResponseCode.REDIRECT);
});

test("Test applicant deleted when application open", async () => {
  const [, applicant] = getUniqueApplicant();
  when(mockApplicantService.findOne(requestUser.id, "authId")).thenResolve(applicant);
  when(mockApplicantService.delete(applicant.id)).thenResolve();

  // Perform the request along /apply/cancel
  const response = await request(bApp).get("/apply/cancel");

  // Check that we get a REDIRECT (302) response code
  verify(mockApplicantService.findOne(requestUser.id, "authId")).once();
  verify(mockApplicantService.save(objectContaining(applicant))).never();
  verify(mockApplicantService.delete(applicant.id)).once();
  expect(response.status).toBe(HttpResponseCode.REDIRECT);
});

test("Test applicant created with valid request, applications open", async () => {
  const [applicantRequest, applicant] = getUniqueApplicant();
  when(mockApplicantService.save(objectContaining(applicant), undefined)).thenResolve(applicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .send({ applicantRequest });

  // Check that we get a OK (200) response code
  expect(response.status).toBe(HttpResponseCode.OK);
});

test("Test applicant created with valid request (using Other input options)", async () => {
  const workArea = "Testtt";
  const [applicantRequest, applicant] = getUniqueApplicant();
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
  expect(response.status).toBe(HttpResponseCode.OK);
});

test("Test applicant created with valid request (with no Other input provided)", async () => {
  const [applicantRequest, applicant] = getUniqueApplicant();
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
  expect(response.status).toBe(HttpResponseCode.OK);
});

test("Test applicant not created with invalid input", async () => {
  const [applicantRequest] = getUniqueApplicant();
  // Mock out the application save call in the service
  when(mockApplicantService.save(anything(), undefined)).thenReject(new Error(""));

  // Perform the post request along /apply
  const response = await request(bApp)
    .post("/apply")
    .send(applicantRequest);

  // Check that we get a BAD_REQUEST (400) response code
  expect(response.status).toBe(HttpResponseCode.BAD_REQUEST);
  expect(response.body.error).toBe(true);
});

test("Test applicant not created with cv too large", async () => {
  // Perform the request along /apply
  const response = await request(bApp)
    .post("/apply")
    .attach("cv", Buffer.alloc(5 * (1 << 21)), { filename: "cv.pdf", contentType: "application/pdf" }) // Create buffer of >5MB
    .field(newApplicantRequest);

  // Check that we get a BAD_REQUEST (400) response code
  expect(response.status).toBe(HttpResponseCode.BAD_REQUEST);
  expect(response.body.error).toBe(true);
  expect(response.body.message).toBe("File too large");
});

test("Test applicant not created with unsupported cv format", async () => {
  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .attach("cv", Buffer.from(""), { filename: "cv.txt" })
    .field(newApplicantRequest);

  // Check that we get a BAD_REQUEST (400) response code
  expect(response.status).toBe(HttpResponseCode.BAD_REQUEST);
  expect(response.body.error).toBe(true);
  expect(response.body.message).toBe("Unsupported file format");
});

test("Test applicant created with doc cv", async () => {
  const cvFile: Buffer = Buffer.from("");
  const [applicantRequest, applicant] = getUniqueApplicant();
  when(mockApplicantService.save(objectContaining(applicant), anyOfClass(Buffer))).thenResolve(applicant);

  // Perform the request along /apply
  const response = await request(bApp)
    .post("/apply")
    .attach("cv", cvFile, { filename: "cv.doc" })
    .field(applicantRequest);

  // Check that we get a OK (200) response code
  expect(response.status).toBe(HttpResponseCode.OK);
});

test("Test applicant created with pdf cv", async () => {
  const cvFile: Buffer = Buffer.from("");
  const [applicantRequest, applicant] = getUniqueApplicant();
  when(mockApplicantService.save(objectContaining(applicant), anyOfClass(Buffer))).thenResolve(applicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .attach("cv", cvFile, "cv.pdf")
    .field(applicantRequest);

  // Check that we get a OK (200) response code
  expect(response.status).toBe(HttpResponseCode.OK);
});

test("Test applicant created with docx cv", async () => {
  const cvFile: Buffer = Buffer.from("");
  const [applicantRequest, applicant] = getUniqueApplicant();
  when(mockApplicantService.save(objectContaining(applicant), anyOfClass(Buffer))).thenResolve(applicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .attach("cv", cvFile, "cv.docx")
    .field(applicantRequest);

  // Check that we get a OK (200) response code
  expect(response.status).toBe(HttpResponseCode.OK);
});

// Checkin Tests
test("Test checkin performed by organiser on confirmed applicant", async () => {
  const [, applicant] = getUniqueApplicant({ needsID: true });
  const testApplicant: Applicant = { ...applicant, applicationStatus: ApplicantStatus.Confirmed };
  when(mockApplicantService.findOne(applicant.id)).thenResolve(testApplicant);

  // Perform the request along /apply/:id/checkin
  const response = await request(bApp).put(`/apply/${applicant.id}/checkin`);

  // Check that we get a OK (200) response code
  expect(response.status).toBe(HttpResponseCode.OK);
  expect(testApplicant.applicationStatus).toBe(ApplicantStatus.Admitted);
});

test("Test checkin not allowed on rejected applicant", async () => {
  const [, applicant] = getUniqueApplicant({ needsID: true });
  when(mockApplicantService.findOne(applicant.id)).thenResolve({
    ...applicant,
    applicationStatus: ApplicantStatus.Rejected
  });

  // Perform the request along /apply/:id/checkin
  const response = await request(bApp).put(`/apply/${applicant.id}/checkin`);

  // Check that we get a BAD_REQUEST (400) response code
  expect(response.status).toBe(HttpResponseCode.BAD_REQUEST);
});

test("Test checkin not allowed on invited applicant", async () => {
  const [, applicant] = getUniqueApplicant({ needsID: true });
  when(mockApplicantService.findOne(applicant.id)).thenResolve({
    ...applicant,
    applicationStatus: ApplicantStatus.Invited
  });

  // Perform the request along /apply/:id/checkin
  const response = await request(bApp).put(`/apply/${applicant.id}/checkin`);

  // Check that we get a BAD_REQUEST (400) response code
  expect(response.status).toBe(HttpResponseCode.BAD_REQUEST);
});
