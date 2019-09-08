import test from "ava";
import * as request from "supertest";
import { App } from "../../../src/app";
import { Express } from "express";
import { initEnv, getTestDatabaseOptions } from "../../util/testUtils";
import { HttpResponseCode } from "../../../src/util/errorHandling";
import { instance, mock, when, reset, anything } from "ts-mockito";
import container from "../../../src/inversify.config";
import { TYPES } from "../../../src/types";
import { Cache } from "../../../src/util/cache";
import { ApplicationService } from "../../../src/services";
import { Sections } from "../../../src/models/sections";
import { Applicant } from "../../../src/models/db";

let bApp: Express;
let mockCache: Cache;
let mockApplicationService: ApplicationService;

const newApplicantRequest: any = {
  applicantName: "test",
  applicantAge: 20,
  applicantGender: "Other",
  applicantGenderOther: "Test",
  applicantNationality: "UK",
  applicantCountry: "UK",
  applicantCity: "Manchester",
  applicantUniversity: "UoM",
  applicantSkills: "",
  applicantWhyChoose: "",
  applicantPastProj: "",
  applicantHardwareReq: "",
  applicantStudyYear: "Foundation",
  applicantWorkArea: "Other",
  applicantWorkAreaOther: "This",
  applicantHackathonCount: 0,
  applicantDietaryRequirements: "Test",
  applicantTShirt: "M"
};
const testApplicant: Applicant = {
  id: undefined,
  name: "test",
  age: 20,
  gender: "Test",
  nationality: "UK",
  country: "UK",
  city: "Manchester",
  university: "UoM",
  skills: "",
  whyChooseHacker: "",
  pastProjects: "",
  hardwareRequests: "",
  yearOfStudy: "Foundation",
  workArea: "This",
  hackathonCount: 0,
  dietaryRequirements: "None",
  tShirtSize: "M"
};

test.before.cb(t => {
  initEnv();
  mockCache = mock(Cache);
  mockApplicationService = mock(ApplicationService);
  container.rebind(TYPES.Cache).toConstantValue(instance(mockCache));
  container.rebind(TYPES.ApplicationService).toConstantValue(instance(mockApplicationService));

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
  reset(mockApplicationService);

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
  when(mockApplicationService.save(anything()))
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
      applicantDietaryRequirements: "Other",
      applicantDietaryRequirementsOther: "Dietary Req"
    });

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test.serial("Test applicant created with valid request (using Other input options)", async t => {
  when(mockApplicationService.save(anything()))
    .thenResolve(testApplicant);

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .send(newApplicantRequest);

  // Check that we get a OK (200) response code
  t.is(response.status, HttpResponseCode.OK);
});

test.serial("Test applicant not created with invalid input", async t => {
  when(mockApplicationService.save(anything()))
    .thenReject(new Error(""));

  // Perform the request along .../apply
  const response = await request(bApp)
    .post("/apply")
    .send(newApplicantRequest);

  // Check that we get a BAD_REQUEST (400) response code
  t.is(response.status, HttpResponseCode.BAD_REQUEST);
  t.is(response.body.error, true);
});