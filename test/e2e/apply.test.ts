import test from "ava";
import * as request from "supertest";
import { App } from "../../src/app";
import { Express } from "express";
import { initEnv, getTestDatabaseOptions } from "../util/testUtils";
import { HttpResponseCode } from "../../src/util/errorHandling";
import container from "../../src/inversify.config";
import { Applicant } from "../../src/models/db";

let bApp: Express;
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
  t.truthy(response.body.id);
  testApplicant.id = response.body.id;
  testApplicant.createdAt = response.body.createdAt;

  // Remove all null properties before comparison
  Object.keys(response.body).forEach(
    key => response.body[key] == null && delete response.body[key]
  );

  t.deepEqual(response.body, { ...testApplicant });
});
