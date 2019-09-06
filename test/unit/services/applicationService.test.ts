import test from "ava";
import { when, mock, instance, verify } from "ts-mockito";
import container from "../../../src/inversify.config";
import { TYPES } from "../../../src/types";

import { ApplicationService } from "../../../src/services";
import { ApplicationRepository } from "../../../src/repositories";
import { Repository } from "typeorm";
import { Applicant } from "../../../src/models/db";

const testApplicantMale: Applicant = new Applicant();
testApplicantMale.id = "7479a451-e968-4271-8073-729ddcf522ee";
testApplicantMale.name = "Test";
testApplicantMale.age = 18;
testApplicantMale.gender = "Male";
testApplicantMale.nationality = "British";
testApplicantMale.country = "UK";
testApplicantMale.city = "Manchester";
testApplicantMale.university = "University of Manchester";
testApplicantMale.yearOfStudy = "1";
testApplicantMale.workArea = "";
testApplicantMale.skills = "";
testApplicantMale.hackathonCount = 0;
testApplicantMale.whyChooseHacker = "";
testApplicantMale.pastProjects = "";
testApplicantMale.hardwareRequests = "";
testApplicantMale.dietaryRequirements = "Halal";
testApplicantMale.tShirtSize = "M";

const testApplicantFemale: Applicant = new Applicant();
testApplicantFemale.id = "7479a451-e826-4271-8073-929ccef522ee";
testApplicantFemale.name = "Test";
testApplicantFemale.age = 18;
testApplicantFemale.gender = "Female";
testApplicantFemale.nationality = "British";
testApplicantFemale.country = "UK";
testApplicantFemale.city = "Manchester";
testApplicantFemale.university = "University of Manchester";
testApplicantFemale.yearOfStudy = "1";
testApplicantFemale.workArea = "";
testApplicantFemale.skills = "";
testApplicantFemale.hackathonCount = 0;
testApplicantFemale.whyChooseHacker = "";
testApplicantFemale.pastProjects = "";
testApplicantFemale.hardwareRequests = "";
testApplicantFemale.dietaryRequirements = "Halal";
testApplicantFemale.tShirtSize = "M";

const testApplicantInvalid: Applicant = new Applicant();
testApplicantInvalid.id = "7479a451-e826-4271-8073-929ccef522ee";
testApplicantInvalid.name = "Test";
testApplicantInvalid.age = 0;
testApplicantInvalid.gender = "Female";
testApplicantInvalid.nationality = "British";
testApplicantInvalid.country = "UK";
testApplicantInvalid.city = "Manchester";
testApplicantInvalid.university = "University of Manchester";
testApplicantInvalid.yearOfStudy = "1";
testApplicantInvalid.workArea = "";
testApplicantInvalid.skills = "";
testApplicantInvalid.hackathonCount = 0;
testApplicantInvalid.whyChooseHacker = "";
testApplicantInvalid.pastProjects = "";
testApplicantInvalid.hardwareRequests = "";
testApplicantInvalid.dietaryRequirements = "Halal";
testApplicantInvalid.tShirtSize = "M";

let applicationService: ApplicationService;
let mockApplicationRepository: Repository<Applicant>;
class StubApplicationRepository extends Repository<Applicant> { }

test.before(t => {
  const stubApplicationRepository: ApplicationRepository = mock(ApplicationRepository);
  mockApplicationRepository = mock(StubApplicationRepository);
  when(stubApplicationRepository.getRepository()).thenReturn(instance(mockApplicationRepository));
  container.rebind(TYPES.ApplicationRepository).toConstantValue(instance(stubApplicationRepository));
});

test.beforeEach(t => {
  // Create a snapshot so each unit test can modify it without breaking other unit tests
  container.snapshot();
  applicationService = container.get(TYPES.ApplicationService);
});

test.afterEach(t => {
  // Restore to last snapshot so each unit test takes a clean copy of the application container
  container.restore();
});

test("Test all applicants can be found", async t => {
  // Set up the stubbed method in the mock
  when(mockApplicationRepository.find())
    .thenResolve([testApplicantMale]);

  // Perform the test by calling the method in the service
  const result: Applicant[] = await applicationService.getAll();

  // Check the result is expected
  t.deepEqual(result[0], testApplicantMale);
  verify(mockApplicationRepository.find()).called();
});
test("Test error thrown when getAll fails", async t => {
  // Set up the stubbed method in the mock
  when(mockApplicationRepository.find())
    .thenReject(new Error());

  // Perform the test by calling the method in the service
  const error: Error = await t.throwsAsync(applicationService.getAll());

  // Check the result is expected
  t.truthy(error);
  verify(mockApplicationRepository.find()).called();
});

test("Test a single applicant can be found", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicationRepository.findOne(testApplicantFemale.id))
    .thenResolve(testApplicantFemale);

  // Perform the test by calling the method in the service
  const result: Applicant = await applicationService.findOne(testApplicantFemale.id);

  // Check the result is expected
  t.deepEqual(result, testApplicantFemale);
  verify(mockApplicationRepository.findOne(testApplicantFemale.id)).once();
});
test("Test error thrown when id not provided to findOne()", async t => {
  // Perform the test by calling the method in the service
  const error: Error = await t.throwsAsync(applicationService.findOne(undefined));

  // Check the result is expected
  t.truthy(error);
  verify(mockApplicationRepository.findOne(undefined)).never();
});
test("Test error thrown when applicant not found", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicationRepository.findOne(testApplicantMale.id))
    .thenReject(new Error());

  // Perform the test by calling the method in the service
  const error: Error = await t.throwsAsync(applicationService.findOne(testApplicantMale.id));

  // Check the result is expected
  t.truthy(error);
  verify(mockApplicationRepository.findOne(testApplicantMale.id)).once();
});

test("Test a single applicant can be created", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicationRepository.save(testApplicantFemale))
    .thenResolve(testApplicantFemale);

  // Perform the test by calling the method in the service
  const result: Applicant = await applicationService.save(testApplicantFemale);

  // Check the result is expected
  t.deepEqual(result, testApplicantFemale);
  verify(mockApplicationRepository.save(testApplicantFemale)).once();
});

test("Test that error thrown when save fails", async t => {
  const testApplicant: Applicant = testApplicantMale;

  // Simulate an error occuring in the database which causes an error to be thrown
  when(mockApplicationRepository.save(testApplicant))
    .thenReject(new Error());

  const error: Error = await t.throwsAsync(applicationService.save(testApplicant));
  // Check the error actually is defined
  t.truthy(error);
  verify(mockApplicationRepository.save(testApplicant)).once();
});
test("Test that error thrown when applicant invalid", async t => {
  // Try and create the applicant and check for error
  const errors: Error = await t.throwsAsync(applicationService.save(testApplicantInvalid));

  // Check the error actually is defined
  t.truthy(errors);
  verify(mockApplicationRepository.save(testApplicantInvalid)).never();
});