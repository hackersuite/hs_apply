import test from "ava";
import { when, mock, instance, verify, anything, objectContaining, reset, resetCalls } from "ts-mockito";
import container from "../../../src/inversify.config";
import { TYPES } from "../../../src/types";

import { ApplicantService } from "../../../src/services";
import { ApplicantRepository } from "../../../src/repositories";
import { Repository } from "typeorm";
import { Applicant } from "../../../src/models/db";

const testApplicantMale: Applicant = new Applicant();
testApplicantMale.id = "7479a451-e968-4271-8073-729ddcf522ee";
testApplicantMale.age = 18;
testApplicantMale.gender = "Male";
testApplicantMale.nationality = "British";
testApplicantMale.country = "UK";
testApplicantMale.city = "Manchester";
testApplicantMale.university = "University of Manchester";
testApplicantMale.degree = "CS";
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
testApplicantFemale.age = 19;
testApplicantFemale.gender = "Female";
testApplicantFemale.nationality = "British";
testApplicantFemale.country = "UK";
testApplicantFemale.city = "Manchester";
testApplicantFemale.university = "University of Manchester";
testApplicantFemale.degree = "CS";
testApplicantFemale.yearOfStudy = "1";
testApplicantFemale.hackathonCount = 0;
testApplicantFemale.dietaryRequirements = "Halal";
testApplicantFemale.tShirtSize = "M";

const testApplicantInvalid: Applicant = new Applicant();
testApplicantInvalid.id = "7479a451-e826-4271-8073-929ccef522ee";
testApplicantInvalid.age = -1;
testApplicantInvalid.gender = "Female";
testApplicantInvalid.nationality = "British";
testApplicantInvalid.country = "UK";
testApplicantInvalid.city = "Manchester";
testApplicantInvalid.university = "University of Manchester";
testApplicantInvalid.yearOfStudy = "1";
testApplicantInvalid.hackathonCount = 0;
testApplicantInvalid.dietaryRequirements = "Halal";
testApplicantInvalid.tShirtSize = "M";

let applicantService: ApplicantService;
let mockApplicantRepository: Repository<Applicant>;
class StubApplicationRepository extends Repository<Applicant> {}

test.before(() => {
  const stubApplicantRepository: ApplicantRepository = mock(ApplicantRepository);
  mockApplicantRepository = mock(StubApplicationRepository);
  when(stubApplicantRepository.getRepository()).thenReturn(instance(mockApplicantRepository));
  container.rebind(TYPES.ApplicantRepository).toConstantValue(instance(stubApplicantRepository));
});

test.beforeEach(() => {
  // Create a snapshot so each unit test can modify it without breaking other unit tests
  container.snapshot();
  applicantService = container.get(TYPES.ApplicantService);
});

test.afterEach(() => {
  // Restore to last snapshot so each unit test takes a clean copy of the application container
  container.restore();
  resetCalls(mockApplicantRepository);
  reset(mockApplicantRepository);
});

test("Test all applicants can be found", async t => {
  // Set up the stubbed method in the mock
  when(mockApplicantRepository.find(undefined)).thenResolve([testApplicantMale]);

  // Perform the test by calling the method in the service
  const result: Applicant[] = await applicantService.getAll();

  // Check the result is expected
  t.deepEqual(result[0], testApplicantMale);
  verify(mockApplicantRepository.find(undefined)).called();
});

test("Test all applicants can be found with specific columns", async t => {
  // Set up the stubbed method in the mock
  const testPartialApplicant = new Applicant();
  testPartialApplicant.age = 18;
  testPartialApplicant.gender = "Male";
  when(mockApplicantRepository.find(objectContaining({ select: ["gender"] }))).thenResolve([testPartialApplicant]);

  // Perform the test by calling the method in the service
  const result: Applicant[] = await applicantService.getAll(["gender"]);

  // Check the result is expected
  t.deepEqual(result[0], testPartialApplicant);
  verify(mockApplicantRepository.find(objectContaining({ select: ["gender"] }))).called();
});

test("Test error thrown when getAll fails", async t => {
  // Set up the stubbed method in the mock
  when(mockApplicantRepository.find(undefined)).thenReject(new Error());

  // Perform the test by calling the method in the service
  const error: Error = await t.throwsAsync(applicantService.getAll());

  // Check the result is expected
  t.truthy(error);
  verify(mockApplicantRepository.find(undefined)).called();
});

test("Test a single applicant can be found", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicantRepository.findOne(objectContaining({ id: testApplicantFemale.id }))).thenResolve(
    testApplicantFemale
  );

  // Perform the test by calling the method in the service
  const result: Applicant = await applicantService.findOne(testApplicantFemale.id);

  // Check the result is expected
  t.deepEqual(result, testApplicantFemale);
  verify(mockApplicantRepository.findOne(objectContaining({ id: testApplicantFemale.id }))).called();
});

test("Test error thrown when id not provided to findOne()", async t => {
  // Perform the test by calling the method in the service
  const error: Error = await t.throwsAsync(applicantService.findOne(undefined));

  // Check the result is expected
  t.truthy(error);
  verify(mockApplicantRepository.findOne(undefined)).never();
});

test("Test error thrown when applicant not found", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicantRepository.findOne(objectContaining({ id: testApplicantMale.id }))).thenReject(new Error());

  // Perform the test by calling the method in the service
  const error: Error = await t.throwsAsync(applicantService.findOne(testApplicantMale.id));

  // Check the result is expected
  t.truthy(error);
  verify(mockApplicantRepository.findOne(objectContaining({ id: testApplicantMale.id }))).once();
});

test("Test a single valid applicant can be created", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicantRepository.save(testApplicantFemale)).thenResolve(testApplicantFemale);

  // Perform the test by calling the method in the service
  const result: Applicant = await applicantService.save(testApplicantFemale);

  // Check the result is expected
  t.deepEqual(result, testApplicantFemale);
  verify(mockApplicantRepository.save(testApplicantFemale)).once();
});

test("Test that error thrown when save fails", async t => {
  // Simulate an error occuring in the database which causes an error to be thrown
  when(mockApplicantRepository.save(testApplicantMale)).thenReject(new Error());

  const error: Error = await t.throwsAsync(applicantService.save(testApplicantMale));
  // Check the error actually is defined
  t.truthy(error);
  verify(mockApplicantRepository.save(testApplicantMale)).once();
});

test("Test that error thrown when applicant invalid", async t => {
  // Try and create the applicant and check for error
  const errors: Error = await t.throwsAsync(applicantService.save(testApplicantInvalid));

  // Check the error actually is defined
  t.truthy(errors);
  verify(mockApplicantRepository.save(testApplicantInvalid)).never();
});

test("Test that error thrown when API keys not set-up for file upload", async t => {
  // Try and create the applicant and check for error
  const errors: Error = await t.throwsAsync(applicantService.save(testApplicantMale, Buffer.from("")));

  // Check the error actually is defined
  t.truthy(errors);
  verify(mockApplicantRepository.save(testApplicantInvalid)).never();
});

test("Test that error thrown when delete is rejected", async t => {
  when(mockApplicantRepository.delete(objectContaining({ id: "0" }))).thenReject(new Error());

  const errors: Error = await t.throwsAsync(applicantService.remove("0"));

  // Check the delete function was called in the mock
  t.truthy(errors);
  verify(mockApplicantRepository.delete(objectContaining({ id: "0" }))).once();
});

test("Test that remove rejected when applicant id not provided", async t => {
  when(mockApplicantRepository.delete(undefined)).thenResolve();

  await t.throwsAsync(applicantService.remove(undefined));

  // Check the delete function was called in the mock
  verify(mockApplicantRepository.delete(undefined)).never();
});

test("Test that applicant can be removed by using the id", async t => {
  when(mockApplicantRepository.delete(objectContaining({ id: testApplicantMale.id }))).thenResolve();

  await t.notThrowsAsync(applicantService.remove(testApplicantMale.id));

  // Check the delete function was called in the mock
  verify(mockApplicantRepository.delete(objectContaining({ id: testApplicantMale.id }))).once();
});

test.serial("Test that all applications and count selected with ascesnding order by date", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicantRepository.findAndCount(anything())).thenResolve([[testApplicantMale, testApplicantFemale], 2]);

  // Call the function in the applicant service
  const result: [Partial<Applicant>[], number] = await applicantService.getAllAndCountSelection(
    ["gender"],
    "age",
    "ASC"
  );

  // Check that the results are as expected
  const allFoundApplicants: Partial<Applicant>[] = result[0];
  const numberOfApplicants: number = result[1];
  t.is(allFoundApplicants[0].gender, testApplicantMale.gender);
  t.is(allFoundApplicants[1].gender, testApplicantFemale.gender);
  t.is(numberOfApplicants, 2);
  verify(mockApplicantRepository.findAndCount(anything())).once();
});

test.serial("Test that all applications and count selected with no ordering", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicantRepository.findAndCount(anything())).thenResolve([[testApplicantMale, testApplicantFemale], 2]);

  // Call the function in the applicant service
  const result: [Partial<Applicant>[], number] = await applicantService.getAllAndCountSelection(["id", "gender"]);

  // Check that the results are as expected
  const allFoundApplicants: Partial<Applicant>[] = result[0];
  const numberOfApplicants: number = result[1];
  t.is(allFoundApplicants[0].id, testApplicantMale.id);
  t.is(allFoundApplicants[0].gender, testApplicantMale.gender);

  t.is(allFoundApplicants[1].id, testApplicantFemale.id);
  t.is(allFoundApplicants[1].gender, testApplicantFemale.gender);
  t.is(numberOfApplicants, 2);
  verify(mockApplicantRepository.findAndCount(anything())).called();
});

test.serial("Test that error thrown when getting applicants and count fails", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicantRepository.findAndCount(anything())).thenThrow(new Error());

  // Call the function in the applicant service
  const error: Error = await t.throwsAsync(applicantService.getAllAndCountSelection(["id"]));

  t.truthy(error);
  verify(mockApplicantRepository.findAndCount(anything())).once();
});
