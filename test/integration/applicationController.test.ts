import test from "ava";
import * as request from "supertest";
import { App } from "../../src/app";
import { Express } from "express";
import { initEnv, getTestDatabaseOptions } from "../util/testUtils";
import { HttpResponseCode } from "../../src/util/errorHandling";
import { instance, mock, when, reset, anything } from "ts-mockito";
import container from "../../src/inversify.config";
import { TYPES } from "../../src/types";
import { Cache } from "../../src/util/cache";
import { ApplicantService } from "../../src/services";
import { Sections } from "../../src/models/sections";
import { Applicant } from "../../src/models/db";

let bApp: Express;
let mockCache: Cache;
let mockApplicantService: ApplicantService;

const newApplicantRequest: any = {
  applicantName: "test",
  applicantAge: 20,
  applicantGender: "Other",
  applicantGenderOther: "Test",
  applicantNationality: "UK",
  applicantCountry: "UK",
  applicantCity: "Manchester",
  applicantUniversity: "UoM",
  applicantStudyYear: "Foundation",
  applicantWorkArea: "Other",
  applicantWorkAreaOther: "This",
  applicantHackathonCount: 0,
  applicantDietaryRequirements: "Other",
  applicantDietaryRequirementsOther: "Test",
  applicantTShirt: "M"
};
const testApplicant: Applicant = new Applicant();
testApplicant.name = "test";
testApplicant.age = 20;
testApplicant.gender = "Test";
testApplicant.nationality = "UK";
testApplicant.country = "UK";
testApplicant.city = "Manchester";
testApplicant.university = "UoM";
testApplicant.yearOfStudy = "Foundation";
testApplicant.workArea = "This";
testApplicant.hackathonCount = 0;
testApplicant.dietaryRequirements = "Test";
testApplicant.tShirtSize = "M";

test.before.cb(t => {
  initEnv();
  mockCache = mock(Cache);
  mockApplicantService = mock(ApplicantService);
  container.rebind(TYPES.Cache).toConstantValue(instance(mockCache));
  container.rebind(TYPES.ApplicantService).toConstantValue(instance(mockApplicantService));

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
  reset(mockApplicantService);

  // Restore to last snapshot so each unit test takes a clean copy of the application container
  container.restore();
});

test("Test that the application page loads", async t => {
  // Mock out the cache -- dont load in the real questions
  when(mockCache.getAll(Sections.name))
    .thenReturn([new Sections([])]);

  // Perform the request along .../apply
  const response = await request(bApp)
    .get("/apply");

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test.serial("Test applicant created with valid request", async t => {
  when(mockApplicantService.save(anything(), anything()))
    .thenResolve(testApplicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .send({
      ...newApplicantRequest,
      applicantWorkArea: "Work Area",
      applicantWorkAreaOther: "",
      applicantGender: "Gender",
      applicantGenderOther: "",
      applicantDietaryRequirements: "Dietary Req",
      applicantDietaryRequirementsOther: ""
    });

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test.serial("Test applicant created with valid request (using Other input options)", async t => {
  when(mockApplicantService.save(anything(), anything()))
    .thenResolve(testApplicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .send(newApplicantRequest);

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test.serial("Test applicant not created with invalid input", async t => {
  when(mockApplicantService.save(anything(), anything()))
    .thenReject(new Error(""));

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .send(newApplicantRequest);

  // Check that we get a BAD_REQUEST (400) response code
  t.is(response.status, HttpResponseCode.BAD_REQUEST);
  t.is(response.body.error, true);
  t.log(response.body.message);
});

test.serial("Test applicant not created with cv too large", async t => {
  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .attach("applicantCV", Buffer.alloc(5 * (1 << 21)), "cv.pdf") // Create buffer of >5MB
    .field(newApplicantRequest);

  // Check that we get a BAD_REQUEST (400) response code
  t.is(response.status, HttpResponseCode.BAD_REQUEST);
  t.is(response.body.error, true);
});


test.serial("Test applicant not created with unsupported cv format", async t => {
  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .attach("applicantCV", Buffer.from(""), "cv.txt")
    .field(newApplicantRequest);

  // Check that we get a BAD_REQUEST (400) response code
  t.is(response.status, HttpResponseCode.BAD_REQUEST);
  t.is(response.body.error, true);
  t.log(response.body);
});

test.serial("Test applicant created with doc cv", async t => {
  when(mockApplicantService.save(anything(), anything()))
    .thenResolve(testApplicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .attach("applicantCV", Buffer.from(""), "cv.doc")
    .field(newApplicantRequest);

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test.serial("Test applicant created with pdf cv", async t => {
  when(mockApplicantService.save(anything(), anything()))
    .thenResolve(testApplicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .attach("applicantCV", Buffer.from(""), "cv.pdf")
    .field(newApplicantRequest);

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test.serial("Test applicant created with docx cv", async t => {
  when(mockApplicantService.save(anything(), anything()))
    .thenResolve(testApplicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .attach("applicantCV", Buffer.from(""), "cv.docx")
    .field(newApplicantRequest);

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});