import test from "ava";
import { when, mock, instance, verify } from "ts-mockito";
import container from "../../../src/inversify.config";
import { TYPES } from "../../../src/types";

import { ApplicationService } from "../../../src/services";
import { ApplicationRepository } from "../../../src/repositories";
import { Repository } from "typeorm";
import { Applicant } from "../../../src/models/db";

const testApplicantMale: Applicant = {
  id: "7479a451-e968-4271-8073-729ddcf522ee",
  name: "Test",
  age: 18,
  gender: "Male",
  nationality: "British",
  country: "UK",
  city: "Manchester",
  university: "University of Manchester",
  yearOfStudy: "1",
  workArea: "",
  skills: "",
  hackathonCount: 0,
  whyChooseHacker: "",
  pastProjects: "",
  hardwareRequests: "",
  dietaryRequirements: "Halal",
  tShirtSize: "M"
};
const testApplicantFemale: Applicant = {
  id: "7479a451-e826-4271-8073-929ccef522ee",
  name: "Test",
  age: 18,
  gender: "Female",
  nationality: "British",
  country: "UK",
  city: "Manchester",
  university: "University of Manchester",
  yearOfStudy: "1",
  workArea: "",
  skills: "",
  hackathonCount: 0,
  whyChooseHacker: "",
  pastProjects: "",
  hardwareRequests: "",
  dietaryRequirements: "Halal",
  tShirtSize: "M"
};

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
  verify(mockApplicationRepository.find()).once();
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

test("Test a single applicant can be created", async t => {
  const newApplicants: Applicant[] = [testApplicantFemale];

  // Set up the stubbed methods in the mock
  when(mockApplicationRepository.save(newApplicants))
    .thenResolve(newApplicants);

  // Perform the test by calling the method in the service
  const result: Applicant[] = await applicationService.save(newApplicants);

  // Check the result is expected
  t.deepEqual(result[0], testApplicantFemale);
  verify(mockApplicationRepository.save(newApplicants)).once();
});

test("Test a multiple applicants can be created", async t => {
  const testApplicantArray: Applicant[] = [testApplicantMale, testApplicantFemale];

  // Set up the stubbed methods in the mock
  when(mockApplicationRepository.save(testApplicantArray))
    .thenResolve(testApplicantArray);

  // Perform the test by calling the method in the service
  const result: Applicant[] = await applicationService.save(testApplicantArray);

  // Check the result is expected
  t.deepEqual(result, testApplicantArray);
  verify(mockApplicationRepository.save(testApplicantArray)).once();
});

test("Test that error thrown when save fails", async t => {
  const testApplicantArray: Applicant[] = [testApplicantMale];

  // Simulate an error occuring in the database which causes an error to be thrown
  when(mockApplicationRepository.save(testApplicantArray))
    .thenReject(new Error("Failed to save applicant"));

  const error = await t.throwsAsync(applicationService.save(testApplicantArray));
  // Check the error actually is defined
  t.truthy(error);
  verify(mockApplicationRepository.save(testApplicantArray)).once();
});