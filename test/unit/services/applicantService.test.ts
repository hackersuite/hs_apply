import test from "ava";
import { when, mock, instance, verify, anything, reset } from "ts-mockito";
import container from "../../../src/inversify.config";
import { TYPES } from "../../../src/types";

import { ApplicantService } from "../../../src/services";
import { ApplicantRepository } from "../../../src/repositories";
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
testApplicantFemale.age = 19;
testApplicantFemale.gender = "Female";
testApplicantFemale.nationality = "British";
testApplicantFemale.country = "UK";
testApplicantFemale.city = "Manchester";
testApplicantFemale.university = "University of Manchester";
testApplicantFemale.yearOfStudy = "1";
testApplicantFemale.hackathonCount = 0;
testApplicantFemale.dietaryRequirements = "Halal";
testApplicantFemale.tShirtSize = "M";

const testApplicantInvalid: Applicant = new Applicant();
testApplicantInvalid.id = "7479a451-e826-4271-8073-929ccef522ee";
testApplicantInvalid.name = "Test";
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
class StubApplicationRepository extends Repository<Applicant> { }

test.before(t => {
  const stubApplicantRepository: ApplicantRepository = mock(ApplicantRepository);
  mockApplicantRepository = mock(StubApplicationRepository);
  when(stubApplicantRepository.getRepository()).thenReturn(instance(mockApplicantRepository));
  container.rebind(TYPES.ApplicantRepository).toConstantValue(instance(stubApplicantRepository));
});

test.beforeEach(t => {
  // Create a snapshot so each unit test can modify it without breaking other unit tests
  container.snapshot();
  applicantService = container.get(TYPES.ApplicantService);
});

test.afterEach(t => {
  // Restore to last snapshot so each unit test takes a clean copy of the application container
  container.restore();
  reset(mockApplicantRepository);
});

test("Test all applicants can be found", async t => {
  // Set up the stubbed method in the mock
  when(mockApplicantRepository.find())
    .thenResolve([testApplicantMale]);

  // Perform the test by calling the method in the service
  const result: Applicant[] = await applicantService.getAll();

  // Check the result is expected
  t.deepEqual(result[0], testApplicantMale);
  verify(mockApplicantRepository.find()).called();
});
test("Test error thrown when getAll fails", async t => {
  // Set up the stubbed method in the mock
  when(mockApplicantRepository.find())
    .thenReject(new Error());

  // Perform the test by calling the method in the service
  const error: Error = await t.throwsAsync(applicantService.getAll());

  // Check the result is expected
  t.truthy(error);
  verify(mockApplicantRepository.find()).called();
});

test("Test a single applicant can be found", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicantRepository.findOne(testApplicantFemale.id))
    .thenResolve(testApplicantFemale);

  // Perform the test by calling the method in the service
  const result: Applicant = await applicantService.findOne(testApplicantFemale.id);

  // Check the result is expected
  t.deepEqual(result, testApplicantFemale);
  verify(mockApplicantRepository.findOne(testApplicantFemale.id)).once();
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
  when(mockApplicantRepository.findOne(testApplicantMale.id))
    .thenReject(new Error());

  // Perform the test by calling the method in the service
  const error: Error = await t.throwsAsync(applicantService.findOne(testApplicantMale.id));

  // Check the result is expected
  t.truthy(error);
  verify(mockApplicantRepository.findOne(testApplicantMale.id)).once();
});

test("Test a single applicant can be created", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicantRepository.save(testApplicantFemale))
    .thenResolve(testApplicantFemale);

  // Perform the test by calling the method in the service
  const result: Applicant = await applicantService.save(testApplicantFemale);

  // Check the result is expected
  t.deepEqual(result, testApplicantFemale);
  verify(mockApplicantRepository.save(testApplicantFemale)).once();
});

test("Test that error thrown when save fails", async t => {
  // Simulate an error occuring in the database which causes an error to be thrown
  when(mockApplicantRepository.save(testApplicantMale))
    .thenReject(new Error());

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

test("Test that error thrown when ENV not set for file upload", async t => {
  // Try and create the applicant and check for error
  const errors: Error = await t.throwsAsync(applicantService.save(testApplicantMale, Buffer.from("")));

  // Check the error actually is defined
  t.truthy(errors);
  verify(mockApplicantRepository.save(testApplicantInvalid)).never();
});

test.serial("Test that all applications and count selected with ascesnding order by date", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicantRepository.findAndCount(anything()))
    .thenResolve([[testApplicantMale, testApplicantFemale], 2]);

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
  when(mockApplicantRepository.findAndCount(anything()))
    .thenResolve([[testApplicantMale, testApplicantFemale], 2]);

  // Call the function in the applicant service
  const result: [Partial<Applicant>[], number] = await applicantService.getAllAndCountSelection(
    ["name", "gender"]
  );

  // Check that the results are as expected
  const allFoundApplicants: Partial<Applicant>[] = result[0];
  const numberOfApplicants: number = result[1];
  t.is(allFoundApplicants[0].gender, testApplicantMale.gender);
  t.is(allFoundApplicants[0].name, testApplicantMale.name);
  t.is(allFoundApplicants[1].gender, testApplicantFemale.gender);
  t.is(allFoundApplicants[1].name, testApplicantFemale.name);
  t.is(numberOfApplicants, 2);
  verify(mockApplicantRepository.findAndCount(anything())).called();
});
test.serial("Test that error thrown when getting applicants and count fails", async t => {
  // Set up the stubbed methods in the mock
  when(mockApplicantRepository.findAndCount(anything()))
    .thenThrow(new Error());

  // Call the function in the applicant service
  const error: Error = await t.throwsAsync(applicantService.getAllAndCountSelection(["name"]));

  t.truthy(error);
  verify(mockApplicantRepository.findAndCount(anything())).once();
});